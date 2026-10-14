/**
 * TaskFlow - Interactive 3D Card Physics & Tilt Glare Engine
 * Brings interactive 3D perspective, depth elevations, and light sheens to dashboard cards
 */

class Card3DTiltEngine {
  constructor() {
    this.boundCards = new WeakSet();
    this.init();
  }

  init() {
    this.bindAllCards();

    // Observe DOM mutations to auto-bind dynamically rendered task cards
    const observer = new MutationObserver(() => {
      this.bindAllCards();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  bindAllCards() {
    const cards = document.querySelectorAll('.stat-card, .task-card, .feature-card, .hero-preview');
    cards.forEach(card => {
      if (!this.boundCards.has(card)) {
        this.bindCard(card);
        this.boundCards.add(card);
      }
    });
  }

  bindCard(card) {
    // Add 3D container styling if not already present
    card.classList.add('card-3d-container');

    // Create dynamic specular glare layer if not existing
    let glare = card.querySelector('.card-3d-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'card-3d-glare';
      card.appendChild(glare);
    }

    let bounds = null;
    let isHovered = false;

    const onMouseEnter = (e) => {
      bounds = card.getBoundingClientRect();
      isHovered = true;
      card.style.transition = 'transform 0.1s ease-out, box-shadow 0.25s ease';
    };

    const onMouseMove = (e) => {
      if (!isHovered || !bounds) {
        bounds = card.getBoundingClientRect();
      }

      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;

      // Calculate percentage (-1 to +1)
      const xPct = (mouseX / bounds.width - 0.5) * 2;
      const yPct = (mouseY / bounds.height - 0.5) * 2;

      // Max tilt degrees
      const maxTilt = 12;
      const rotateX = -yPct * maxTilt;
      const rotateY = xPct * maxTilt;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(12px) scale3d(1.025, 1.025, 1.025)`;

      // Move specular glare highlight
      const glareAngle = Math.atan2(yPct, xPct) * (180 / Math.PI) + 90;
      const glareOpacity = Math.min(0.35, Math.hypot(xPct, yPct) * 0.4);
      glare.style.opacity = glareOpacity;
      glare.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 75%)`;
    };

    const onMouseLeave = () => {
      isHovered = false;
      card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
      glare.style.opacity = '0';
    };

    card.addEventListener('mouseenter', onMouseEnter);
    card.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
  }
}

// Global initialization
window.card3DTilt = new Card3DTiltEngine();
