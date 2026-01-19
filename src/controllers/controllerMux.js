// Controller multiplexer - combines pose and keyboard inputs
export class ControllerMux {
  constructor(poseController, keyboardController) {
    this.poseController = poseController;
    this.keyboardController = keyboardController;
  }

  getActions() {
    const kbActions = this.keyboardController.getActions();
    return kbActions;
  }

  getActionsFromPose(landmarks) {
    if (landmarks) {
      return this.poseController.detectActions(landmarks);
    }
    return { jump: false, duck: false };
  }
}
