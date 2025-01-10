/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  // Cordova is now initialized. Have fun!

  //déclaration des variables
  const divLogin = document.getElementById("loginPage");
  const divJeu = document.getElementById("jeu");
  const divStats = document.getElementById("statsPage");
  const divLogout = document.getElementById("logoutPage");
  const inputUsername = document.getElementById("username");
  const inputPassword = document.getElementById("password");
  const btnPlay = document.getElementById("toJeu");
  const ws = new WebSocket("ws://127.0.0.1:9898/"); //127.0.0.1:9898 pour browser et 10.0.0.2:9898 pour emulateur

  //déclaration des variables pour une partie
  let username = null;
  let isjoueurWhite = null;
  let adversaire = null;
  let highlightedCells = [];
  let myturn = false;
  let selectedCell = null;

  // Dimensions du plateau
  const boardSize = 8; // 8x8 cases
  const cellSize = 50; // Chaque case est de 50x50 pixels
  const board = document.getElementById("board");
  const pieces = document.getElementById("pieces");
  let selectedPiece = null; // Variable pour stocker le pion sélectionné

  ws.onopen = function () {
    console.log("Connecté");
    const message = { type: "Hello", message: "Hello" };
    ws.send(JSON.stringify(message));
  };
  ws.onmessage = function (e) {
    message = JSON.parse(e.data);
    console.log("Message:", e.data);

    if (message.type == "login" && message.success) {
      username = message.joueur.username;
      divLogin.style.display = "none";
      divStats.style.display = "block";
      divLogout.style.display = "block";
      updateStats();
    }

    if (message.type == "debutMatch") {
      divStats.style.display = "none";
      divJeu.style.display = "block";
      btnPlay.disabled = false;
      btnPlay.innerText = "";
      if(message.joueur1 == username){
        isjoueurWhite = message.joueur1Color == "W";
        adversaire = message.joueur2;
      }else{
        isjoueurWhite = message.joueur2Color == "W";
        adversaire = message.joueur1;
      }
      if(isjoueurWhite){
        document.getElementById("nameWhite").innerText = username;
        document.getElementById("nameBlack").innerText = adversaire;
      }else{
        document.getElementById("nameWhite").innerText = adversaire;
        document.getElementById("nameBlack").innerText = username;
      }
      myturn = isjoueurWhite;
      document.getElementById("nameTurn").innerText = myturn ? "À vous de jouer" : "À l'adversaire de jouer";
    }

    if (message.type == "move") {

    }
  };
  ws.onclose = function () {
    console.log("Fermé");
  };

  //envoie un message de connection au serveur node, il est de type login et contient le nom d'utilisateur et le motde passe
  document.getElementById("loginButton").addEventListener("click", function () {
    message = {
      type: "login",
      username: inputUsername.value,
      password: inputPassword.value,
    };
    ws.send(JSON.stringify(message));
  });

  //envoie un message de déconnection au serveur node, il est de type logout et contient le nom d'utilisateur
  document
    .getElementById("logoutButton")
    .addEventListener("click", function () {
      message = {
        type: "logout",
        username: username, //username dans local storage à terme
      };
      ws.send(JSON.stringify(message));
    });

  //envoie un message de demande demande de partie au serveur node, il est de type demande et contient le nom d'utilisateur
  btnPlay.addEventListener("click", function () {
    btnPlay.disabled = true;
    btnPlay.innerText = "En attente d'un adversaire...";
    message = {
      type: "fileAttente",
      username: username,
    };
    ws.send(JSON.stringify(message));
  });

  

  // Fonction pour générer le plateau
  function generateBoard() {
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        // Alterner les couleurs
        const isBlack = (row + col) % 2 === 1;
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("x", col * cellSize);
        rect.setAttribute("y", row * cellSize);
        rect.setAttribute("width", cellSize);
        rect.setAttribute("height", cellSize);
        rect.setAttribute("fill", isBlack ? "#000000" : "#ffffff");
        rect.setAttribute("data-row", row);
        rect.setAttribute("data-col", col);
        rect.setAttribute("stroke", "#333");
        rect.setAttribute("stroke-width", "1");
        rect.style.cursor = "pointer";

        // Ajouter un événement de clic sur les cases
        rect.addEventListener("click", (e) => onCellClick(e, row, col));

        board.appendChild(rect);
      }
    }
  }

  // Fonction pour générer les pions
  function generatePieces() {
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        // Pions noirs (rangées 0 à 2) et blancs (rangées 5 à 7) sur les cases noires
        if ((row + col) % 2 === 1) {
          // Case noire
          if (row < 3) {
            createPiece(row, col, "#808080"); // Pion noir
          } else if (row > 4) {
            createPiece(row, col, "#ffffff"); // Pion blanc
          }
        }
      }
    }
  }

  // Fonction pour créer un pion
  function createPiece(row, col, color) {
    const piece = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    piece.setAttribute("cx", col * cellSize + cellSize / 2); // Centre X
    piece.setAttribute("cy", row * cellSize + cellSize / 2); // Centre Y
    piece.setAttribute("r", cellSize / 2.5); // Rayon du pion
    piece.setAttribute("fill", color);
    piece.setAttribute("stroke", "#333");
    piece.setAttribute("stroke-width", "2");
    piece.setAttribute("data-row", row);
    piece.setAttribute("data-col", col);
    piece.style.cursor = "pointer";

    // Ajouter un événement de clic sur le pion
    piece.addEventListener("click", (e) => onPieceClick(e, piece));

    pieces.appendChild(piece);
  }

  // Fonction appelée lorsqu'un pion est cliqué
  function onPieceClick(e, piece) {
    if (myturn && piece.getAttribute("fill") === (isjoueurWhite ? "#ffffff" : "#808080")) {
      e.stopPropagation(); // Empêche la propagation pour éviter d'activer d'autres événements
      if (selectedPiece) {
        // Si un autre pion est déjà sélectionné, désélectionner
        selectedPiece.setAttribute("stroke", "#333");
        selectedPiece.setAttribute("stroke-width", "2");
        document.querySelectorAll('rect[fill="rgba(0, 255, 0, 0.5)"]').forEach((highlightedCell) => {
          highlightedCell.setAttribute("fill", (parseInt(highlightedCell.getAttribute("data-row")) + parseInt(highlightedCell.getAttribute("data-col"))) % 2 === 1 ? "#000000" : "#ffffff");
        });

      }

      // Sélectionner le nouveau pion
      selectedPiece = piece;
      selectedPiece.setAttribute("stroke", "yellow");
      selectedPiece.setAttribute("stroke-width", "4");

      // Mettre en surbrillance les déplacements possibles 
      highlightedCells = []
      const currentRow = parseInt(selectedPiece.getAttribute("data-row"));
      const currentCol = parseInt(selectedPiece.getAttribute("data-col"));
      const directions = [
        [-1, -1], // Haut-gauche
        [-1, 1],  // Haut-droite
        [1, -1],  // Bas-gauche
        [1, 1],   // Bas-droite
      ];

      // Surligner les cases valides
      for (let [dr, dc] of directions) {
        const targetRow = currentRow + dr;
        const targetCol = currentCol + dc;
        const cell = document.querySelector(`[data-row='${targetRow}'][data-col='${targetCol}']`);
        const circleInCell = Array.from(document.querySelectorAll("circle")).some(
          (circle) =>
            parseInt(circle.getAttribute("data-row")) === targetRow &&
            parseInt(circle.getAttribute("data-col")) === targetCol
        );
        if (cell && !circleInCell) {
          cell.setAttribute("fill", "rgba(0, 255, 0, 0.5)");
          highlightedCells.push(cell);
        }
        if (cell && circleInCell) {
          // Trouver le cercle dans la case intermédiaire
          const intermediateCircle = Array.from(document.querySelectorAll("circle")).find(
            (circle) =>
              parseInt(circle.getAttribute("data-row")) === targetRow &&
              parseInt(circle.getAttribute("data-col")) === targetCol
          );

          const isWhite = selectedPiece.getAttribute("fill") === "#ffffff"; // Blanc
          const isForward = (isWhite && dr === -1) || (!isWhite && dr === 1); // Avant

          // Vérifier que la couleur du cercle est opposée
          if (
            intermediateCircle &&
            intermediateCircle.getAttribute("fill") !== selectedPiece.getAttribute("fill") &&
            isForward
          ) {
            const nextRow = targetRow + dr;
            const nextCol = targetCol + dc;

            // Vérifier la case après le pion
            const nextCell = document.querySelector(`[data-row='${nextRow}'][data-col='${nextCol}']`);
            const circleInNextCell = Array.from(document.querySelectorAll("circle")).some(
              (circle) =>
                parseInt(circle.getAttribute("data-row")) === nextRow &&
                parseInt(circle.getAttribute("data-col")) === nextCol
            );

            // Surligner la case suivante si elle est vide
            if (nextCell && !circleInNextCell) {
              nextCell.setAttribute("fill", "rgba(0, 255, 0, 0.5)");
              highlightedCells.push(nextCell);
            }
          }
        }

      }
    }
  }

  // Fonction appelée lorsqu'une case est cliquée
  function onCellClick(e, row, col) {
    if (myturn && selectedPiece) {
      // Vérifier si la case cliquée est parmi les cases en surbrillance
      const clickedCell = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
      const isHighlighted = highlightedCells.includes(clickedCell);

      if (!isHighlighted) {
        console.log("Déplacement non valide.");
        return; // Annuler l'action si la cellule n'est pas en surbrillance
      }

      //envoie un message de déplacement au serveur node, il est de type move et contient les coordonnées de départ et d'arrivée
      message = {
        type: "move",
        username: username,
        x_depart: selectedPiece.getAttribute("data-col"),
        y_depart: selectedPiece.getAttribute("data-row"),
        x_arrivee: col,
        y_arrivee: row,
        couleur:
          selectedPiece.getAttribute("fill") == "#ffffff" ? "white" : "black",
      };

      ws.send(JSON.stringify(message));

      // Déterminer les coordonnées intermédiaires (pour un saut)
      const currentRow = parseInt(selectedPiece.getAttribute("data-row"));
      const currentCol = parseInt(selectedPiece.getAttribute("data-col"));
      const midRow = (currentRow + row) / 2;
      const midCol = (currentCol + col) / 2;

      // Vérifier si un pion est présent sur la case intermédiaire
      const capturedPiece = Array.from(document.querySelectorAll("circle")).find(
        (circle) =>
          parseInt(circle.getAttribute("data-row")) === midRow &&
          parseInt(circle.getAttribute("data-col")) === midCol
      );

      // Si un pion est capturé, le retirer
      if (capturedPiece) {
        pieces.removeChild(capturedPiece);
        console.log("Pion capturé :", capturedPiece);
      }



      // Déplacer le pion vers la nouvelle case
      selectedPiece.setAttribute("cx", col * cellSize + cellSize / 2);
      selectedPiece.setAttribute("cy", row * cellSize + cellSize / 2);

      // Mettre à jour les coordonnées du pion
      selectedPiece.setAttribute("data-row", row);
      selectedPiece.setAttribute("data-col", col);

      // Désélectionner le pion
      selectedPiece.setAttribute("stroke", "#333");
      selectedPiece.setAttribute("stroke-width", "2");
      selectedPiece = null;

      // Enlever la surbrillance des anciens déplacements possibles
      document.querySelectorAll('rect[fill="rgba(0, 255, 0, 0.5)"]').forEach((highlightedCell) => {
        highlightedCell.setAttribute("fill", (parseInt(highlightedCell.getAttribute("data-row")) + parseInt(highlightedCell.getAttribute("data-col"))) % 2 === 1 ? "#000000" : "#ffffff");
      });



    }
  }

  function updateStats() {
    message = {
      type: "demandeStats",
      username: username,
    };
    ws.send(JSON.stringify(message));
  }

  // Générer le plateau et les pions
  generateBoard();
  generatePieces();

}
