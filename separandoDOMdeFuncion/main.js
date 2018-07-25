let facebook = document.getElementById('facebook');
let gmail = document.getElementById('gmail');
const name = document.getElementById('name');
const lastName = document.getElementById('lastName');
const email = document.getElementById('email');
const password = document.getElementById('password');
const email1 = document.getElementById('email2');
const password1 = document.getElementById('password2');
const register = document.getElementById('register');
const ingreso = document.getElementById('ingreso');
const closeSesion = document.getElementById('close');

function validarForm(){
  
  var expRegNombre=/^[a-zA-ZÑñÁáÉéÍíÓóÚúÜü\s]+$/;
  var expRegApellidos=/^[a-zA-ZÑñÁáÉéÍíÓóÚúÜü\s]+$/;
  var expRegCorreo= /^[a-zA-ZÑñÁáÉéÍíÓóÚúÜü\s]+$/;
  ///^\w+@(\w+\.)+\w{2,4}$/; 


     //Campo nombre
     if(!name.value)
     {
      alert("El campo nombre es requerido");
      name.focus();
      return false;
     }
     if (!expRegNombre.exec(name.value))
     {
        alert("El campo nombre admite letras y espacios.")
        name.focus();
        return false;
     }
     //Campo apellido
     if(!lastName.value)
     {
      alert("El campo apellidos es requerido");
      lastName.focus();
      return false;
     }
     if(!expRegApellidos.exec(lastName.value))
     {
       alert("El campo apellidos admite letras y espacios.")
       lastName.focus();
       return false;
     }


     //campo email
     if(!email.value)
     {
      alert("El campo correo es requerido");
     email.focus();
      return false;
     }
     if(!expRegCorreo.exec(email.value))
     {
       alert("El campo correo no tiene el formato correcto.")
       email.focus();
       return false;
     }
   

     return true;
  }
  // asociacion del boton enviar con el formulario en html
  

 register.addEventListener('click', () => {
   if (validarForm){
   registerVal(name.value, lastName.value, email.value, password.value);
   }
 })
//   for (let i = 0; i < lastName.value.length; i++) { //adaptar a los valores      
//     if (lastName.value[i].type == 'text') {
//       if (lastName[i].value == null || lastName[i].value.length == 0 || /^\s*$/.test(lastName[i].value)) {
//         alert(lastName[i].name + ' no puede estar vacio o contener espacios en blanco.');
//         ok = false;
//         break;
//       }
//     }
//   }

//   if (/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email.value) == false) {
//     alert("Direccion de correo invalida.");
//     ok = false;

//     if (name.value.length === 0 && name.value.length) {
//       alert('Ingresa nombre correcto');
//     } else if (Lastname.value.length === 0 && Lastname.value.length <=   ) {
//       alert('Ingresa Apellido correcto');
//       if (email1.value.length === 0) {
//         alert('ingrese un correo');
//       } else if (password1.value.length <= 6) {
//         alert('ingrese una Contraseña de mas de 6 caracteres');
//       } else {
//         alert('Has sido registrado exitosamente')
//       }

//     })

ingreso.addEventListener('click', () => {
  ingresoVal(email1.value, password1.value);
  // observador();
  // aparece();
});

gmail.addEventListener('click', () => {
  gmailLogin();
});

facebook.addEventListener('click', () => {
  facebookLogin();
});

// closeSesion.addEventListener('click', () => {
//   close();
// })
