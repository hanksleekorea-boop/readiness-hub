/* Public AdSense configuration. Publisher and slot IDs are public identifiers, not secrets. */
(function () {
  'use strict';
  window.CRH_ADSENSE_CONFIG = Object.freeze({
    schema: 'crh-adsense-config/v1',
    provider: 'google-adsense',
    codeActivated: true,
    publisherId: 'ca-pub-2476023536699107',
    sellerId: 'pub-2476023536699107',
    sellerCertificationId: 'f08c47fec0942fa0',
    rootAdsTxtUrl: 'https://hanksleekorea-boop.github.io/ads.txt',
    productionOrigin: 'https://hanksleekorea-boop.github.io',
    productionPathPrefix: '/readiness-hub/',
    verifiedResponsiveSlot: '4822559136',
    slots: Object.freeze({
      guideInline: Object.freeze({ id: '4822559136', format: 'auto' }),
      guideWide: Object.freeze({ id: '4822559136', format: 'auto' })
    }),
    eligiblePathPrefixes: Object.freeze(['/readiness-hub/learn/']),
    messagingOnlyPathPrefixes: Object.freeze(['/readiness-hub/advertising/']),
    excludedPathPrefixes: Object.freeze([
      '/readiness-hub/m/',
      '/readiness-hub/workbench/',
      '/readiness-hub/dashboard.html',
      '/readiness-hub/account/',
      '/readiness-hub/terms/',
      '/readiness-hub/privacy/',
      '/readiness-hub/help/',
      '/readiness-hub/404.html'
    ]),
    privacy: Object.freeze({
      personalizedAds: false,
      googleCertifiedCmpRequired: true,
      accountManagedMessagesRequired: true,
      respectGlobalPrivacyControl: true,
      diagnosticAnswersUsedForAds: false
    }),
    accountState: Object.freeze({
      publisherAndSlotVerified: true,
      rootAdsTxtVerified: true,
      siteApproval: 'requires-google-confirmation',
      europeanMessage: 'requires-google-confirmation',
      usStatesMessage: 'requires-google-confirmation'
    })
  });
})();
