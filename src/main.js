
var config = {
  apiKey: "AIzaSyAyU-144GII0BR3pdmRcq70rWM_9-fKthY",
  authDomain: "socialnetwork-proyect.firebaseapp.com",
  databaseURL: "https://socialnetwork-proyect.firebaseio.com",
  projectId: "socialnetwork-proyect",
  storageBucket: "socialnetwork-proyect.appspot.com",
  messagingSenderId: "1041163805568"
  };
  
  //firebase.initializeApp(config);
  window.addEventListener('load', precargaImagenes);
  
  function precargaImagenes(){
  

  
  
    //Cuando se terminan de cargar las imágenes se le agrega la clase "close" a #wrap-preload.
    const preload = document.getElementById('wrap-preload');
  
    preload.classList.add('close');
  
    console.log('Sitio cargado!');
  
  }

  const publicar = document.getElementById('publicar').addEventListener(click, (event)=>{

    event.target()

  })