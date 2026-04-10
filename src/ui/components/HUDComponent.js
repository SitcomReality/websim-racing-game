import { BaseComponent } from './BaseComponent.js';

/** 
 * HUDComponent - Heads-up display component
 */
export class HUDComponent extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    this.steps = new Map();
    this.currentStep = 1;
    this.statusText = '';
  }

  initialize() {
    super.initialize();
    this.setupSteps();
    this.updateDisplay();
  }

  setupSteps() {
    const stepElements = this.element.querySelectorAll('.step');
    stepElements.forEach((step, index) => {
      const stepNumber = parseInt(step.getAttribute('data-step'));
      this.steps.set(stepNumber, step);
    });
  }

  setStep(stepNumber, state) {
    const step = this.steps.get(stepNumber);
    if (!step) return;

    // Remove existing states
    step.classList.remove('active', 'done');
    
    // Add new state
    if (state) {
      step.classList.add(state);
    }
  }

  setStatus(text) {
    this.statusText = text;
    const statusElement = this.element.querySelector('#statusText');
    if (statusElement) {
      statusElement.textContent = text;
    }
  }

  updateSteps(stepsData) {
    if (!stepsData) return;

    stepsData.forEach(stepData => {
      this.setStep(stepData.step, stepData.state);
    });
  }

  updateDisplay() {
    // Update step indicators
    this.steps.forEach((step, stepNumber) => {
      if (stepNumber <= this.currentStep) {
        step.classList.add('done');
        if (stepNumber === this.currentStep) {
          step.classList.add('active');
        }
      }
    });

    // Update status text
    this.setStatus(this.statusText);
  }

  refresh() {
    this.updateDisplay();
  }
}