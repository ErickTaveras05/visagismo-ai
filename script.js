// script.js con KNN mejorado y métricas extendidas para mayor precisión

const frontInput = document.getElementById('front-input');
const sideInput  = document.getElementById('side-input');
const frontCanvas = document.getElementById('front-canvas');
const sideCanvas  = document.getElementById('side-canvas');
const frontCtx    = frontCanvas.getContext('2d');
const sideCtx     = sideCanvas.getContext('2d');

let trainingData = [];

async function loadTrainingData() {
  try {
    const res = await fetch('datos_entrenamiento.json');
    trainingData = await res.json();
  } catch (e) {
    console.warn('No se pudo cargar datos de entrenamiento:', e);
  }
}

function dist(p1, p2) {
  const dx = p1.x - p2.x, dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

function getMetrics(landmarks) {
  const toPx = i => landmarks[i];
  const chin = toPx(152), brow = toPx(10);
  const cheekL = toPx(127), cheekR = toPx(356);
  const jawL = toPx(234), jawR = toPx(454);
  const frenteL = toPx(70), frenteR = toPx(300);
  const narizT = toPx(1), narizB = toPx(6);
  const ojoL = toPx(33), ojoR = toPx(263);
  const bocaL = toPx(61), bocaR = toPx(291);
  const menton = toPx(199), centro = toPx(168);
  const narizAnchoL = toPx(94), narizAnchoR = toPx(331);
  const labioSup = toPx(13), labioInf = toPx(14);

  const faceLen = dist(chin, brow);
  const cheekW = dist(cheekL, cheekR);
  const jawW = dist(jawL, jawR);
  const frenteW = dist(frenteL, frenteR);
  const narizL = dist(narizT, narizB);
  const ojosW = dist(ojoL, ojoR);
  const bocaW = dist(bocaL, bocaR);
  const mentonLen = dist(menton, centro);
  const narizAncho = dist(narizAnchoL, narizAnchoR);
  const labioAltura = dist(labioSup, labioInf);

  return [
    faceLen, cheekW, jawW, frenteW, narizL,
    ojosW, bocaW, mentonLen, narizAncho, labioAltura
  ];
}

function classifyKNN(inputFeatures, k = 3) {
  if (trainingData.length < k) return 'Indefinido';

  const distances = trainingData.map(item => {
    const d = Math.hypot(
      ...item.features.map((val, i) => val - inputFeatures[i])
    );
    return { label: item.label, dist: d };
  });

  distances.sort((a, b) => a.dist - b.dist);
  const labels = distances.slice(0, k).map(d => d.label);

  const counts = labels.reduce((acc, l) => {
    acc[l] = (acc[l] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function drawLandmarks(ctx, landmarks, canvas) {
  ctx.fillStyle = 'red';
  landmarks.forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, 2 * Math.PI);
    ctx.fill();
  });
}

function drawLines(ctx, canvas, pairs, landmarks) {
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 1;
  pairs.forEach(([i, j]) => {
    const p1 = landmarks[i];
    const p2 = landmarks[j];
    ctx.beginPath();
    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
    ctx.stroke();
  });
}

function addExampleToTraining(features, label) {
  trainingData.push({ features, label });
  console.log(`Ejemplo añadido: ${label}`, features);
}

async function processImage(file, canvas, ctx, faceMesh) {
  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = async () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    faceMesh.onResults(results => {
      ctx.drawImage(img, 0, 0);

      if (!results.multiFaceLandmarks.length) {
        ctx.fillStyle = 'red';
        ctx.font = '24px Arial';
        ctx.fillText('No se detectó rostro', 10, 30);
        return;
      }

      const lm = results.multiFaceLandmarks[0];
      drawLandmarks(ctx, lm, canvas);
      drawLines(ctx, canvas, [
        [152, 10], [127, 356], [234, 454],
        [70, 300], [1, 6], [33, 263], [61, 291],
        [199, 168], [94, 331], [13, 14]
      ], lm);

      const metrics = getMetrics(lm);
      const shape = classifyKNN(metrics);

      ctx.fillStyle = 'blue';
      ctx.font = '30px Arial';
      ctx.fillText(`Forma: ${shape}`, 10, 40);

      const guardar = confirm('¿Agregar este ejemplo al entrenamiento?');
      if (guardar) {
        const nuevaEtiqueta = prompt('Etiqueta para este rostro:', shape);
        if (nuevaEtiqueta) addExampleToTraining(metrics, nuevaEtiqueta);
      }
    });

    await faceMesh.send({ image: img });
  };
}

async function createFaceMesh() {
  const fm = new FaceMesh({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  fm.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  await fm.initialize();
  return fm;
}

(async () => {
  await loadTrainingData();
  const faceMesh = await createFaceMesh();

  frontInput.addEventListener('change', e => {
    if (e.target.files[0]) {
      processImage(e.target.files[0], frontCanvas, frontCtx, faceMesh);
    }
  });

  sideInput.addEventListener('change', e => {
    if (e.target.files[0]) {
      processImage(e.target.files[0], sideCanvas, sideCtx, faceMesh);
    }
  });
})();
