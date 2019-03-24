import DiscoveryFamily from '../index';

let dfc = new DiscoveryFamily();
dfc.refreshBearerToken().then((res) => {
   dfc.getLiveStreamUrl().then((res) => {
       console.log(res.streamUrl)
   })
});
