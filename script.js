const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d');

const frontInput = document.getElementById('front-input');

frontInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const faceMesh = new FaceMesh({ locateFile: (file) => 
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` 
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(results => {
      if (results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        for (let point of landmarks) {
          ctx.beginPath();
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 1, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });

    await faceMesh.send({ image: img });
  };
});
