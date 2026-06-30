/* ==========================================================================
   Winograd - chat.js
   Voiceflow chat widget loader.
   ========================================================================== */
(function () {
  "use strict";

  window.voiceflow = window.voiceflow || {};
  window.voiceflow.chat = window.voiceflow.chat || {};

  var script = document.createElement("script");
  script.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
  script.type = "text/javascript";
  script.onload = function () {
    window.voiceflow.chat.load({
      verify: { projectID: "6a3be962e6d47fa28bf50c84" },
      url: "https://general-runtime.voiceflow.com",
      versionID: "production"
    });
  };

  document.head.appendChild(script);
})();
