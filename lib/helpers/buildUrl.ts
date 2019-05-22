export function buildUrl(serverUrl: string, apiKey: string, tautulliCommand: string) {
  return serverUrl + '/api/v2?apikey=' + apiKey + '&cmd=' + tautulliCommand;
}
