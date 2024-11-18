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
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    const divLogin= document.getElementById('loginPage');
    const divJeu= document.getElementById('jeu');
    const divStats= document.getElementById('statsPage');
    const divLogout= document.getElementById('logoutPage');
    const inputUsername= document.getElementById('username');
    const inputPassword= document.getElementById('password');
    const ws = new WebSocket('ws://127.0.0.1:9898/');

    ws.onopen = function() {
        console.log('Connecté');
        ws.send('Hello');
        };
    ws.onmessage = function(e) {
        console.log('Message:', e.data);
        };
    ws.onclose = function() {
        console.log('Fermé');
        };
    
    //envoie un message de connection au serveur node, il est de tyep login et contient le nom d'utilisateur et le motde passe
    document.getElementById('loginButton').addEventListener('click', function() {
        message= {
            type: 'login',
            username: inputUsername.value,
            password: inputPassword.value
        };
        ws.send(JSON.stringify(message));
    });

    //envoie un message de déconnection au serveur node, il est de type logout et contient le nom d'utilisateur
    document.getElementById('logoutButton').addEventListener('click', function() {
        message= {
            type: 'logout',
            username: ''//username dans local storage à terme
        };
        ws.send(JSON.stringify(message));
    });



}
