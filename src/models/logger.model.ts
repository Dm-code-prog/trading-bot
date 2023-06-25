export class Logger {
  service: string = '';
  environment: string = '';

  constructor(service: string, environment: string) {
    this.service = service;
    this.environment = environment;
  }

  log(text: string) {
    console.log(this.service, this.environment, text);
  }

  error(text: string) {
    console.error(this.service, this.environment, 'ERROR', text);
  }
}
