/* Compatibility entry point. Canonical implementation: tubes/shared/modules/PlaylistTools-Standalone.js */
(function(){
  if(window.BakedPlaylistToolsV1 || document.querySelector('script[data-baked-playlist-tools-loader]'))return;
  const script=document.createElement('script');
  script.dataset.bakedPlaylistToolsLoader='true';
  script.src='https://buttocks.github.io/bakednetwork/tubes/shared/modules/PlaylistTools-Standalone.js';
  script.async=true;
  script.onerror=function(){script.remove();console.error('Playlist Tools could not load');};
  (document.head||document.documentElement).appendChild(script);
})();
