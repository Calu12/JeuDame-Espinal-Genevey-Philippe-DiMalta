// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  // Cordova is now initialized. Have fun!

  //////////////////////////////////////////////////////////// Définition des variables ////////////////////////////////////////////////////////////////////////

  //déclaration des variables
  const divLogin = document.getElementById("loginPage");
  const divJeu = document.getElementById("jeu");
  const divStats = document.getElementById("statsPage");
  const divLogout = document.getElementById("logoutPage");
  const inputUsername = document.getElementById("username");
  const inputPassword = document.getElementById("password");
  const btnPlay = document.getElementById("toJeu");
  const divEndGame = document.getElementById("endGamePage");
  const messageEndGame = document.getElementById("endGameMessage");
  const tableStats = document.getElementById("listeJoueurs");
  const ws = new WebSocket("ws://127.0.0.1:9898/"); //127.0.0.1:9898 pour browser et 10.0.0.2:9898 pour emulateur

  //déclaration des variables pour une partie
  let username = null;
  let isjoueurWhite = null;
  let adversaire = null;
  let highlightedCells = [];
  let myturn = false;

  // Dimensions et variables du plateau
  const boardSize = 8; // 8x8 cases
  const cellSize = 50; // Chaque case est de 50x50 pixels
  const board = document.getElementById("board");
  const pieces = document.getElementById("pieces");
  let selectedPiece = null; // Variable pour stocker le pion sélectionné

  //////////////////////////////////////////////////////////// WebSocket ////////////////////////////////////////////////////////////////////////

  ws.onopen = function () {
    console.log("Connecté");
    const message = { type: "Hello", message: "Hello" };
    ws.send(JSON.stringify(message));
  };
  ws.onmessage = function (e) {
    message = JSON.parse(e.data);
    console.log("Message:", e.data);

    //message de connection
    if (message.type == "login" && message.success) {
      username = message.joueur.username;
      divLogin.style.display = "none";
      divStats.style.display = "block";
      divLogout.style.display = "block";
      updateStats();
    }

    //message de déconnection
    if (message.type == "logout" && message.success) {
      username = null;
      btnPlay.disabled = false;
      btnPlay.innerText = "Chercher une partie";
      divLogin.style.display = "block";
      divStats.style.display = "none";
      divLogout.style.display = "none";
      divJeu.style.display = "none";
      divEndGame.style.display = "none";
      tableStats.innerHTML = "";
    }

    //message de debut de partie
    if (message.type == "debutMatch") {
      generatePieces();
      divStats.style.display = "none";
      divLogout.style.display = "none";
      divJeu.style.display = "block";
      btnPlay.disabled = false;
      btnPlay.innerText = "Chercher une partie";
      if (message.joueur1 == username) {
        isjoueurWhite = message.joueur1Color == "W";
        adversaire = message.joueur2;
      } else {
        isjoueurWhite = message.joueur2Color == "W";
        adversaire = message.joueur1;
      }
      if (isjoueurWhite) {
        document.getElementById("nameWhite").innerText = username;
        document.getElementById("nameBlack").innerText = adversaire;
      } else {
        document.getElementById("nameWhite").innerText = adversaire;
        document.getElementById("nameBlack").innerText = username;
      }
      myturn = isjoueurWhite;
      document.getElementById("nameTurn").innerText = myturn
        ? "À vous de jouer"
        : "À l'adversaire de jouer";
    }

    //message de validation d'un mouvement
    if (message.type == "moveReturn") {
      console.log("Déplacement reçu :", message);
      // Déterminer les coordonnées intermédiaires (pour un saut)
      const currentRow = message.y_depart;
      const currentCol = message.x_depart;
      const midRow = (currentRow + message.y_arrivee) / 2;
      const midCol = (currentCol + message.x_arrivee) / 2;

      // Vérifier si un pion est présent sur la case intermédiaire
      const capturedPiece = Array.from(
        document.querySelectorAll("circle")
      ).find(
        (circle) =>
          parseInt(circle.getAttribute("data-row")) === midRow &&
          parseInt(circle.getAttribute("data-col")) === midCol
      );

      // Si un pion est capturé, le retirer
      if (capturedPiece) {
        pieces.removeChild(capturedPiece);
        console.log("Pion capturé :", capturedPiece);
      }

      // Trouver le pion à déplacer
      const piece = Array.from(document.querySelectorAll("circle")).find(
        (circle) =>
          parseInt(circle.getAttribute("data-row")) === currentRow &&
          parseInt(circle.getAttribute("data-col")) === currentCol
      );

      console.log("Pion déplacé :", piece);

      // Déplacer le pion vers la nouvelle case
      piece.setAttribute("cx", message.x_arrivee * cellSize + cellSize / 2);
      piece.setAttribute("cy", message.y_arrivee * cellSize + cellSize / 2);

      // Mettre à jour les coordonnées du pion
      piece.setAttribute("data-row", message.y_arrivee);
      piece.setAttribute("data-col", message.x_arrivee);

      // Désélectionner le pion
      piece.setAttribute("stroke", "#333");
      piece.setAttribute("stroke-width", "2");
      selectedPiece = null;

      // Enlever la surbrillance des anciens déplacements possibles
      document
        .querySelectorAll('rect[fill="rgb(0, 255, 0)"]')
        .forEach((highlightedCell) => {
          highlightedCell.setAttribute(
            "fill",
            (parseInt(highlightedCell.getAttribute("data-row")) +
              parseInt(highlightedCell.getAttribute("data-col"))) %
              2 ===
              1
              ? "#000000"
              : "#ffffff"
          );
        });

      myturn = !myturn;
      document.getElementById("nameTurn").innerText = myturn
        ? "À vous de jouer"
        : "À l'adversaire de jouer";
    }

    //message de fin de partie
    if (message.type == "finMatch") {
      if (message.winner == username) {
        messageEndGame.innerText = "Félicitations, vous avez gagné !";
      } else {
        messageEndGame.innerText = "Dommage, vous avez perdu...";
      }
      divJeu.style.display = "none";
      divEndGame.style.display = "block";
      resetGame();
      divLogout.style.display = "block";
    }

    //message de mise a jour des stats
    if (message.type == "stats") {
      tableStats.innerHTML = "";
      const header = document.createElement("tr");
      const th1 = document.createElement("th");
      const th2 = document.createElement("th");
      const th3 = document.createElement("th");
      const th4 = document.createElement("th");
      const th5 = document.createElement("th");
      th1.innerText = "Joueur";
      th2.innerText = "Victoires";
      th3.innerText = "Défaites";
      th4.innerText = "Match nuls";
      th5.innerText = "Parties jouées";
      header.appendChild(th1);
      header.appendChild(th2);
      header.appendChild(th3);
      header.appendChild(th4);
      header.appendChild(th5);
      tableStats.appendChild(header);

      // Tri des stats par ordre décroissant des victoires
      const sortedStats = message.stats.sort(
        (a, b) => b.matchesGagnes - a.matchesGagnes
      );

      sortedStats.forEach((element) => {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        const td2 = document.createElement("td");
        const td3 = document.createElement("td");
        const td4 = document.createElement("td");
        const td5 = document.createElement("td");
        td1.innerText = element.username;
        td2.innerText = element.matchesGagnes;
        td3.innerText = element.matchesPerdus;
        td4.innerText = element.matchesNuls;
        td5.innerText = element.matchesJoues;
        if (element.username == username) {
          tr.style.fontweight = "bold";
        }
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tr.appendChild(td5);
        tableStats.appendChild(tr);
      });
    }
  };
  ws.onclose = function () {
    console.log("Fermé");
  };

  //////////////////////////////////////////////////////////// Buttons Events ////////////////////////////////////////////////////////////////////////

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

  //envoie un message de demande de partie au serveur node, il est de type demande et contient le nom d'utilisateur
  btnPlay.addEventListener("click", function () {
    btnPlay.disabled = true;
    btnPlay.innerText = "En attente d'un adversaire...";
    message = {
      type: "fileAttente",
      username: username,
    };
    ws.send(JSON.stringify(message));
  });

  //envoie d'un abandon au serveur node, il est de type abandon et contient le nom d'utilisateur
  document.getElementById("abandonner").addEventListener("click", function () {
    message = {
      type: "abandon",
      username: username,
    };
    ws.send(JSON.stringify(message));
  });

  //bouton pour retourner au menu de stats et le mettre à jour
  document.getElementById("toStats").addEventListener("click", function () {
    divEndGame.style.display = "none";
    updateStats();
    divStats.style.display = "block";
  });

  //////////////////////////////////////////////////////////// Fonctions ////////////////////////////////////////////////////////////////////////

  // Fonction pour générer le plateau
  function generateBoard() {
    // Adjust SVG viewBox to leave space for labels
    const svgPadding = 20; // Space for labels
    board.setAttribute("width", boardSize * cellSize + svgPadding);
    board.setAttribute("height", boardSize * cellSize + svgPadding);
    board.setAttribute(
      "viewBox",
      `-20 -20 ${boardSize * cellSize + svgPadding} ${
        boardSize * cellSize + svgPadding
      }`
    );

    // Add column labels (A-H)
    for (let col = 0; col < boardSize; col++) {
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      label.setAttribute("x", col * cellSize + cellSize / 2);
      label.setAttribute("y", -5); // Position above the board
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "12");
      label.setAttribute("fill", "#000");
      label.textContent = String.fromCharCode(65 + col); // A, B, C, ..., H
      board.appendChild(label);
    }

    // Add row labels (7-0 for correct orientation)
    for (let row = 0; row < boardSize; row++) {
      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      label.setAttribute("x", -10); // Position to the left of the board
      label.setAttribute("y", row * cellSize + cellSize / 2 + 4); // Centered vertically
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "12");
      label.setAttribute("fill", "#000");
      label.textContent = row; // Correct orientation (0 at the top, 7 at the bottom)
      board.appendChild(label);
    }

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
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
    if (
      myturn &&
      piece.getAttribute("fill") === (isjoueurWhite ? "#ffffff" : "#808080")
    ) {
      e.stopPropagation(); // Empêche la propagation pour éviter d'activer d'autres événements
      if (selectedPiece) {
        // Si un autre pion est déjà sélectionné, désélectionner
        selectedPiece.setAttribute("stroke", "#333");
        selectedPiece.setAttribute("stroke-width", "2");
        document
          .querySelectorAll('rect[fill="rgb(0, 255, 0)"]')
          .forEach((highlightedCell) => {
            highlightedCell.setAttribute(
              "fill",
              (parseInt(highlightedCell.getAttribute("data-row")) +
                parseInt(highlightedCell.getAttribute("data-col"))) %
                2 ===
                1
                ? "#000000"
                : "#ffffff"
            );
          });
      }

      // Sélectionner le nouveau pion
      selectedPiece = piece;
      selectedPiece.setAttribute("stroke", "yellow");
      selectedPiece.setAttribute("stroke-width", "4");

      // Mettre en surbrillance les déplacements possibles
      highlightedCells = [];
      const currentRow = parseInt(selectedPiece.getAttribute("data-row"));
      const currentCol = parseInt(selectedPiece.getAttribute("data-col"));
      const directions = [
        [-1, -1], // Haut-gauche
        [-1, 1], // Haut-droite
        [1, -1], // Bas-gauche
        [1, 1], // Bas-droite
      ];

      // Surligner les cases valides
      for (let [dr, dc] of directions) {
        const targetRow = currentRow + dr;
        const targetCol = currentCol + dc;
        const cell = document.querySelector(
          `[data-row='${targetRow}'][data-col='${targetCol}']`
        );
        const circleInCell = Array.from(
          document.querySelectorAll("circle")
        ).some(
          (circle) =>
            parseInt(circle.getAttribute("data-row")) === targetRow &&
            parseInt(circle.getAttribute("data-col")) === targetCol
        );

        // Déplacements d'un pion simple en avant 
        const isForward = (isWhite && dr === -1) || (!isWhite && dr === 1); // Avant
        if (cell && !circleInCell && isForward) {
          cell.setAttribute("fill", "rgba(0, 255, 0, 0.5)");
          highlightedCells.push(cell);
        }

        // Capture d'un pion simple
        if (cell && circleInCell) {
          // Trouver le cercle dans la case intermédiaire
          const intermediateCircle = Array.from(
            document.querySelectorAll("circle")
          ).find(
            (circle) =>
              parseInt(circle.getAttribute("data-row")) === targetRow &&
              parseInt(circle.getAttribute("data-col")) === targetCol
          );

          const isWhite = selectedPiece.getAttribute("fill") === "#ffffff"; // Blanc
          

          // Vérifier que la couleur du cercle est opposée
          if (
            intermediateCircle &&
            intermediateCircle.getAttribute("fill") !==
              selectedPiece.getAttribute("fill") 
          ) {
            const nextRow = targetRow + dr;
            const nextCol = targetCol + dc;

            // Vérifier la case après le pion
            const nextCell = document.querySelector(
              `[data-row='${nextRow}'][data-col='${nextCol}']`
            );
            const circleInNextCell = Array.from(
              document.querySelectorAll("circle")
            ).some(
              (circle) =>
                parseInt(circle.getAttribute("data-row")) === nextRow &&
                parseInt(circle.getAttribute("data-col")) === nextCol
            );

            // Surligner la case suivante si elle est vide
            if (nextCell && !circleInNextCell) {
              nextCell.setAttribute("fill", "rgb(0, 255, 0)");
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
      const clickedCell = document.querySelector(
        `[data-row='${row}'][data-col='${col}']`
      );
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
        couleur: selectedPiece.getAttribute("fill") == "#ffffff" ? "W" : "B",
      };

      ws.send(JSON.stringify(message));
    }
  }

  function updateStats() {
    message = {
      type: "demandeStats",
      username: username,
    };
    ws.send(JSON.stringify(message));
  }

  // Fonction pour réinitialiser les variable de jeu
  function resetGame() {
    pieces.innerHTML = "";
    selectedPiece = null;
    highlightedCells = [];
    myturn = null;
    isjoueurWhite = null;
    adversaire = null;
  }

  //////////////////////////////////////////////// Initialisation ////////////////////////////////////////////////////////////////////////

  // Générer le plateau au lancement de l'application
  generateBoard();
}
