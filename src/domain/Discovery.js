export class Discovery {
  static isDiscovered(id, discoveredSet) {
    return discoveredSet.has(id);
  }

  static markDiscovered(id, discoveredSet) {
    discoveredSet.add(id);
  }

  static getProgress(discoveredSet, total) {
    return `${discoveredSet.size} / ${total} Arquitecturas descubiertas`;
  }

  static isComplete(discoveredSet, total) {
    return discoveredSet.size >= total;
  }
}