/*global chrome*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        // Perform cookie operations in the background page, because not all foreground pages have access to the cookie API.
        // Firefox does not support incognito split mode, so we use tabs[0].cookieStoreId to select the right cookie store.
        // Chrome does not support tabs[0].cookieStoreId, which means it is undefined, and we end up using the default cookie store according to incognito split mode.
        if (request.message === 'getSfHost') {
            // When on a *.visual.force.com page, the session in the cookie does not have API access,
            // so we read the corresponding session from *.salesforce.com page.
            // The first part of the session cookie is the OrgID,
            // which we use as key to support being logged in to multiple orgs at once.
            // http://salesforce.stackexchange.com/questions/23277/different-session-ids-in-different-contexts
            // There is no straight forward way to unambiguously understand if the user authenticated against salesforce.com or cloudforce.com
            // (and thereby the domain of the relevant cookie) cookie domains are therefore tried in sequence.
            chrome.cookies.get(
                {
                    url: tabs[0].url,
                    name: 'sid',
                    storeId: tabs[0].cookieStoreId
                },
                cookie => {
                    if (!cookie) {
                        sendResponse(null);
                        return;
                    }
                    let [orgId] = cookie.value.split('!');
                    chrome.cookies.getAll(
                        {
                            name: 'sid',
                            domain: 'salesforce.com',
                            secure: true,
                            storeId: tabs[0].cookieStoreId
                        },
                        cookies => {
                            let sessionCookie = cookies.find(c =>
                                c.value.startsWith(orgId + '!')
                            );
                            if (sessionCookie) {
                                sendResponse(sessionCookie.domain);
                            } else {
                                chrome.cookies.getAll(
                                    {
                                        name: 'sid',
                                        domain: 'cloudforce.com',
                                        secure: true,
                                        storeId: tabs[0].cookieStoreId
                                    },
                                    allCookies => {
                                        sessionCookie = allCookies.find(c =>
                                            c.value.startsWith(orgId + '!')
                                        );
                                        if (sessionCookie) {
                                            sendResponse(sessionCookie.domain);
                                        } else {
                                            sendResponse(null);
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            );
            return true; // Tell Chrome that we want to call sendResponse asynchronously.
        }
        if (request.message === 'getSession') {
            chrome.cookies.get(
                {
                    url: 'https://' + request.sfHost,
                    name: 'sid',
                    storeId: tabs[0].cookieStoreId
                },
                sessionCookie => {
                    if (!sessionCookie) {
                        sendResponse(null);
                        return;
                    }
                    let session = {
                        key: sessionCookie.value,
                        hostname: sessionCookie.domain
                    };
                    sendResponse(session);
                }
            );
            return true; // Tell Chrome that we want to call sendResponse asynchronously.
        }
        return false;
    });
    return true;
});
