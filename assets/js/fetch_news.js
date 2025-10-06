// document.addEventListener('DOMContentLoaded', () => {
//   const placeholder = document.getElementById('loading-placeholder');
//   const widget = document.getElementById('linkedin-widget');
//   const iframe = widget?.querySelector('iframe');

//   if (!iframe) return;

//   const showWidget = () => {
//     if (placeholder) placeholder.style.display = 'none';
//     if (widget) widget.style.display = 'block';
//   };

//   iframe.addEventListener('load', showWidget);
//   setTimeout(showWidget, 2000);
// });

//   console.log("📰 News & Events page with LinkedIn iframe feed initialized.");

document.addEventListener('DOMContentLoaded', () => {
const placeholder = document.getElementById('loading-placeholder');
const widget = document.getElementById('linkedin-widget');
const iframe = widget?.querySelector('iframe');

if (!iframe) return;

let loaded = false;

const showWidget = () => {
  if (loaded) return;
  loaded = true;
  
  if (placeholder) {
    placeholder.style.transition = 'opacity 0.3s';
    placeholder.style.opacity = '0';
    setTimeout(() => {
      placeholder.style.display = 'none';
    }, 300);
  }
  
  if (widget) {
    widget.style.display = 'block';
    widget.style.opacity = '0';
    setTimeout(() => {
      widget.style.transition = 'opacity 0.5s';
      widget.style.opacity = '1';
    }, 50);
  }
};

iframe.addEventListener('load', () => {
  setTimeout(showWidget, 500);
});

// Fallback timeout
setTimeout(showWidget, 1000);
});