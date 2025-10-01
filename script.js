const vehiculo = document.getElementById('vehiculo');
const pista = document.getElementById('pista');
const botonIniciarPausar = document.getElementById('botonIniciarPausar');
const botonReiniciar = document.getElementById('botonReiniciar');

const campoPositionInicial = document.getElementById('posicionInicial');
const campoVelocidadInicial = document.getElementById('velocidadInicial');
const campoAceleracion = document.getElementById('aceleracion');

const mostrarTiempo = document.getElementById('tiempoActual');
const mostrarPosicion = document.getElementById('posicionActual');
const mostrarVelocidad = document.getElementById('velocidadActual');

// === Variables de estado de la simulación ===
let posicionActual;
let velocidadActual;
let aceleracionActual;
let posicionInicialGuardada;
let velocidadInicialGuardada;

let tiempoTranscurrido = 0;
let momentoInicio = null;
let ultimaActualizacionGrafica;
let identificadorAnimacion;
let simulacionEnEjecucion = false;

// === Constantes de configuración ===
const ESCALA_PISTA_METROS = 1000;
const INTERVALO_ACTUALIZACION_GRAFICA_MS = 100;

// === Configuración de gráficas con Chart.js ===
function crearGrafica(contexto, etiqueta) {
  return new Chart(contexto, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: etiqueta,
          data: [],
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      animation: { duration: 0 },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Tiempo (s)',
          },
        },
      },
    },
  });
}

const graficaPosicion = crearGrafica(document.getElementById('graficaPosicion').getContext('2d'), 'Posición (m)');
const graficaVelocidad = crearGrafica(document.getElementById('graficaVelocidad').getContext('2d'), 'Velocidad (m/s)');
const graficaAceleracion = crearGrafica(
  document.getElementById('graficaAceleracion').getContext('2d'),
  'Aceleración (m/s²)'
);

// === Funciones principales de la simulación ===
function actualizarSimulacion(momentoActual) {
  if (!simulacionEnEjecucion) return;

  if (!momentoInicio) momentoInicio = momentoActual;
  tiempoTranscurrido = (momentoActual - momentoInicio) / 1000;

  calcularCinematica();
  actualizarVisualizacion();
  actualizarPosicionVehiculo();

  if (debeActualizarGraficas(momentoActual)) {
    ultimaActualizacionGrafica = momentoActual;
    agregarDatosAGraficas(tiempoTranscurrido, posicionActual, velocidadActual, aceleracionActual);
  }

  identificadorAnimacion = requestAnimationFrame(actualizarSimulacion);
}

function calcularCinematica() {
  velocidadActual = velocidadInicialGuardada + aceleracionActual * tiempoTranscurrido;
  posicionActual =
    posicionInicialGuardada +
    velocidadInicialGuardada * tiempoTranscurrido +
    0.5 * aceleracionActual * (tiempoTranscurrido * tiempoTranscurrido);
}

function actualizarVisualizacion() {
  mostrarTiempo.textContent = tiempoTranscurrido.toFixed(2);
  mostrarPosicion.textContent = posicionActual.toFixed(2);
  mostrarVelocidad.textContent = velocidadActual.toFixed(2);
}

function actualizarPosicionVehiculo() {
  const anchoPista = pista.clientWidth;
  const anchoVehiculo = vehiculo.clientWidth;
  const posicionEnPixeles = (posicionActual / ESCALA_PISTA_METROS) * anchoPista;

  const posicionVisual = posicionEnPixeles - anchoVehiculo / 2;

  if (vehiculoDentroDePista(posicionEnPixeles, anchoPista, anchoVehiculo)) {
    vehiculo.style.left = posicionVisual + 'px';
  } else {
    alternarEstadoSimulacion();
  }
}

function vehiculoDentroDePista(posicionPixeles, anchoPista, anchoVehiculo) {
  return posicionPixeles >= 0 && posicionPixeles <= anchoPista - anchoVehiculo;
}

function debeActualizarGraficas(momentoActual) {
  return momentoActual - ultimaActualizacionGrafica > INTERVALO_ACTUALIZACION_GRAFICA_MS;
}

function alternarEstadoSimulacion() {
  if (!simulacionEnEjecucion) {
    iniciarSimulacion();
  } else {
    pausarSimulacion();
  }
}

function iniciarSimulacion() {
  simulacionEnEjecucion = true;
  botonIniciarPausar.textContent = 'Pausar';

  if (esPrimeraEjecucion()) {
    establecerValoresIniciales();
  }

  ajustarMomentoInicio();
  ultimaActualizacionGrafica = performance.now();
  identificadorAnimacion = requestAnimationFrame(actualizarSimulacion);
}

function pausarSimulacion() {
  simulacionEnEjecucion = false;
  botonIniciarPausar.textContent = 'Reanudar';
  cancelAnimationFrame(identificadorAnimacion);
}

function esPrimeraEjecucion() {
  return momentoInicio === null;
}

function ajustarMomentoInicio() {
  momentoInicio = performance.now() - tiempoTranscurrido * 1000;
}

function establecerValoresIniciales(limpiarCamposEntrada = false) {
  tiempoTranscurrido = 0;
  momentoInicio = null;

  if (limpiarCamposEntrada) {
    restaurarValoresPredeterminados();
  }

  leerValoresDeEntrada();
  inicializarVariablesCinematicas();
  actualizarInterfazInicial();
  limpiarGraficas();
}

function restaurarValoresPredeterminados() {
  campoPositionInicial.value = 0;
  campoVelocidadInicial.value = 0;
  campoAceleracion.value = 2;
}

function leerValoresDeEntrada() {
  posicionInicialGuardada = parseFloat(campoPositionInicial.value) || 0;
  velocidadInicialGuardada = parseFloat(campoVelocidadInicial.value) || 0;
  aceleracionActual = parseFloat(campoAceleracion.value) || 0;
}

function inicializarVariablesCinematicas() {
  posicionActual = posicionInicialGuardada;
  velocidadActual = velocidadInicialGuardada;
}

function actualizarInterfazInicial() {
  mostrarTiempo.textContent = '0.00';
  mostrarPosicion.textContent = posicionActual.toFixed(2);
  mostrarVelocidad.textContent = velocidadActual.toFixed(2);
  vehiculo.style.left = (posicionActual / 100) * pista.clientWidth + 'px';
}

function limpiarGraficas() {
  [graficaPosicion, graficaVelocidad, graficaAceleracion].forEach(grafica => {
    grafica.data.labels = [];
    grafica.data.datasets[0].data = [];
    grafica.update();
  });
}

function agregarDatosAGraficas(tiempo, posicion, velocidad, aceleracion) {
  const tiempoFormateado = tiempo.toFixed(1);

  [graficaPosicion, graficaVelocidad, graficaAceleracion].forEach(grafica =>
    grafica.data.labels.push(tiempoFormateado)
  );

  graficaPosicion.data.datasets[0].data.push(posicion);
  graficaVelocidad.data.datasets[0].data.push(velocidad);
  graficaAceleracion.data.datasets[0].data.push(aceleracion);

  [graficaPosicion, graficaVelocidad, graficaAceleracion].forEach(grafica => grafica.update('quiet'));
}

function detenerYReiniciarSimulacion() {
  if (simulacionEnEjecucion) {
    simulacionEnEjecucion = false;
    cancelAnimationFrame(identificadorAnimacion);
  }
  botonIniciarPausar.textContent = 'Iniciar';
  establecerValoresIniciales(true);
}

function manejarCambioPosicionInicial() {
  if (simulacionEnEjecucion) return;

  posicionInicialGuardada = parseFloat(campoPositionInicial.value) || 0;
  posicionActual = posicionInicialGuardada;

  mostrarPosicion.textContent = posicionActual.toFixed(2);
  actualizarPosicionVehiculo();
}

// === Eventos de usuario ===
botonIniciarPausar.addEventListener('click', alternarEstadoSimulacion);
botonReiniciar.addEventListener('click', detenerYReiniciarSimulacion);

campoPositionInicial.addEventListener('change', manejarCambioPosicionInicial);

// === Inicialización ===
establecerValoresIniciales(false);
