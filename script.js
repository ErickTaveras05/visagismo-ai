let model;

async function loadModel() {
  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
  );
  console.log("Modelo cargado");
}

loadModel();

function handleImageUpload(inputId, imgId, canvasId) {
  const input = document.getElementById(inputId);
  const img = document.getElementById(imgId);
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  input.addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (file) {
      img.src = URL.createObjectURL(file);

      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const predictions = await model.estimateFaces({
          input: img,
          returnTensors: false,
          flipHorizontal: false,
        });

        if (predictions.length > 0) {
          predictions.forEach(prediction => {
            const keypoints = prediction.keypoints;
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            keypoints.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
              ctx.stroke();
            });
          });
        } else {
          alert("No se detectó rostro.");
        }
      };
    }
  });
}

handleImageUpload("front-input", "front-preview", "output-canvas");
