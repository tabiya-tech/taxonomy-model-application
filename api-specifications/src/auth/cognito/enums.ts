namespace CognitoEnums {
  /**
   * Cognito JWT Auth Types.
   *
   * Different access types from aws-cognito.
   * - Human-in-the-loop: JWTs issued to human users after they log in.
   * - Machine-to-machine: JWTs issued to machines or services for inter-service communication.
   */
  export enum TokenType {
    HUMAN_IN_THE_LOOP = "human-in-the-loop",
    MACHINE_TO_MACHINE = "machine-to-machine",
  }
}

export default CognitoEnums;
