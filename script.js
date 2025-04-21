document.getElementById('front-input').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    const img = document.getElementById('front-preview');
    img.src = URL.createObjectURL(file);
  }
});

document.getElementById('side-input').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (file) {
    const img = document.getElementById('side-preview');
    img.src = URL.createObjectURL(file);
  }
});
