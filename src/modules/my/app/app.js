/* global chrome*/
import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    @track loaded = true;
    @track sfHost;
    @track session;

    connectedCallback() {
        const sfHostReturn = new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ message: 'getSfHost' }, sfHost => {
                if (sfHost) {
                    resolve(sfHost);
                }
                reject('Error retrieving the current hostname.');
            });
        });
        const sessionReturn = hostname =>
            new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { message: 'getSession', sfHost: hostname },
                    session => {
                        if (session) {
                            resolve(session);
                        }
                        reject('Error retrieving the current session.');
                    }
                );
            });
        sfHostReturn
            .then(hostname => {
                this.sfHost = hostname;
                if (hostname !== null) {
                    this.loaded = true;
                }
                return sessionReturn(hostname);
            })
            .then(session => {
                this.session = JSON.stringify(session);
            });
    }
}
