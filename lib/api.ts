import {getBearerTokenDTV} from "./providers/directv";
import {DiscoveryTokenResponse, DiscoveryLivestreamResponse} from "./providers/oauth_helpers";
import axios, {AxiosInstance} from "axios";

export class discoveryFamily {
    public discoveryTokenResponse: DiscoveryTokenResponse;
    public axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: "https://api.discovery.com/v1/",
            headers: {
                "accept": "*/*",
                'Accept-Encoding': "None",
                "User-Agent": "Family%20GO/201 CFNetwork/758.5.3 Darwin/15.6.0",
                "Authorization": `Bearer PLACEHOLDER`
            }
        })
    }

    private refresheAxiosBearer() {
        this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${this.discoveryTokenResponse.BearerToken}`;
    }

    public refreshBearerToken(provider: string = "dtv"): Promise<any> {
        switch (provider) {
            case "dtv":
                return getBearerTokenDTV().then((res) => {
                    this.discoveryTokenResponse = res;
                    this.refresheAxiosBearer();
                    return res;
                });
        }
    }

    public _getLiveStreamManifest() {
        return this.axiosInstance.get("content/livestreams?sort=rank&networks.code=DFC&embed=networks.field(id,name,image)")
    }

    public getLiveStreamUrl() {
        return this._getLiveStreamManifest().then((res) => {
            let links = res.data[0].links;
            let playDFCApiLink;
            links.forEach((link) => {
                if (link['rel'] == "play_DFC") {
                    playDFCApiLink = link['href'];
                }
            });
            if (!playDFCApiLink) {
                Promise.reject("play_DFC link not found.");
            }

            return this.axiosInstance.get(playDFCApiLink);
        }).then((res) => {
            return new DiscoveryLivestreamResponse(res.data.streamUrl, res.data.hdsStreamUrl, res.data.ssdaiStreamUrl);
        })
    }
}
