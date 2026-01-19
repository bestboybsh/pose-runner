// Modal dialog view manager
export class ModalView {
  constructor(modalEl, closeBtnEl) {
    this.modalEl = modalEl;
    this.closeBtnEl = closeBtnEl;
    this.setupListeners();
  }

  setupListeners() {
    if (this.closeBtnEl) {
      this.closeBtnEl.addEventListener('click', () => this.hide());
    }
    
    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target === this.modalEl) {
          this.hide();
        }
      });
    }

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  show(content) {
    if (this.modalEl) {
      if (typeof content === 'string') {
        this.modalEl.querySelector('.modal-content')?.appendChild(
          document.createTextNode(content)
        );
      }
      this.modalEl.style.display = 'flex';
    }
  }

  hide() {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
      const content = this.modalEl.querySelector('.modal-content');
      if (content) content.innerHTML = '';
    }
  }

  isVisible() {
    return this.modalEl && this.modalEl.style.display === 'flex';
  }
}
