import * as htmlparser from "htmlparser2";
import * as querystring from "query-string";

export class DiscoveryTokenResponse {
    public BearerToken: string;
    public setAt: number;
    public expiresAt: number;

    constructor(bearer: string, expiresSeconds: number) {
        this.setBearerToken(bearer, expiresSeconds);
    }

    setBearerToken(bearer: string, expiresSeconds: number) {
        let currentTime = Math.round((new Date()).getTime() / 1000);
        this.BearerToken = bearer;
        this.setAt = currentTime;
        this.expiresAt = currentTime + expiresSeconds;
    }

    expired() {
        return Math.round((new Date()).getTime() / 1000) > this.expiresAt;
    }
}

export class DiscoveryLivestreamResponse {
    streamUrl: string;
    hdsStreamUrl: string; // usually empty. May be an encrypted stream.
    ssdaiStreamUrl: string; // ssdai: Server-Side Dynamic Ad Insertion
    cuePoints: string[]; // may not be string[]. Empty while testing
    captions: string[]; // may not be string[]. Empty while testing
    vendorAttributes: string[]; // // may not be string[]. Empty while testing
    constructor(streamUrl: string, hdsStreamurl: string, ssdaiStreamUrl) {
        this.streamUrl = streamUrl;
        this.hdsStreamUrl = hdsStreamurl;
        this.ssdaiStreamUrl = ssdaiStreamUrl;
        // not implementing other attributes due to them being unknown.
    }

}

export function getAdobeFormFromHtml(htmlContent) {
    let formAction;
    let formData = {};
    new htmlparser.Parser({
        onopentag: function (name, attribs) {
            if (name == "input") {
                formData[attribs.name] = attribs.value;
            }
            if (name == "form") {
                formAction = attribs.action;
            }
        }
    }, {decodeEntities: true, lowerCaseTags: true}).write(htmlContent);
    return [formAction, formData];
}
export function axiosValidateStatusAllowRedirects(status) {
    return status >= 200 && status < 400
}
export function parseDiscoveryFinalResponse(fullUrl): querystring.ParsedUrl {
    // they effectively pass the query string back to the client, but with a hash instead.
    // This is actually good practice so that their server (discovery.com) doesn't see the oath return tokens
    fullUrl = fullUrl.replace("#", "?");
    return querystring.parseUrl(fullUrl);
}
