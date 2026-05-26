export interface TicketLookupProvider {
  regionCode: string;
  displayName: string;
  /** Present for web-based providers; opens a WebView or external URL. */
  lookupUrl?: (ticketNumber?: string) => string;
  instructions: string;
  /**
   * Present for API-based providers. When set the lookup screen renders
   * a native form instead of a WebView.
   */
  apiLookup?: {
    /** Identifies which service module to use, e.g. "jamaica". */
    serviceKey: string;
  };
}
