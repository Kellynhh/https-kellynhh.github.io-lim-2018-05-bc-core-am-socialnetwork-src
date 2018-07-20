
var config = {
    apiKey: "AIzaSyAyU-144GII0BR3pdmRcq70rWM_9-fKthY",
    authDomain: "socialnetwork-proyect.firebaseapp.com",
    databaseURL: "https://socialnetwork-proyect.firebaseio.com",
    projectId: "socialnetwork-proyect",
    storageBucket: "socialnetwork-proyect.appspot.com",
    messagingSenderId: "1041163805568"
  };
  
  firebase.initializeApp(config);
  window.addEventListener('load', precargaImagenes);
  
  function precargaImagenes(){
  
    const img1 = new Image();
    img1.src = "../imagenes/mundo.jpg";
  
    const img2 = new Image();
    img2.src = '../imagenes/ciudad.jpg';
  
    const img3 = new Image();
    img3.src = '../imagenes/renovable2.png';
  
  
    //Cuando se terminan de cargar las imágenes se le agrega la clase "close" a #wrap-preload.
    const preload = document.getElementById('wrap-preload');
  
    preload.classList.add('close');
  
    console.log('Sitio cargado!');
  
  }