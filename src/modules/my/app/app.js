/* global chrome*/
import { LightningElement, track } from 'lwc';
import JSForce from '../../../resources/jsforce';

export default class App extends LightningElement {
    @track loaded = false;
    @track error = false;
    @track jsforce;
    @track fullNames;

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
                return sessionReturn(hostname);
            })
            .then(session => {
                this.jsforce = new JSForce(session.hostname, session);
            })
            .then(() => {
                return this.jsforce.getWorkflowMetadataSummary();
            })
            .then(workflowSummary => {
                return workflowSummary.map(e => e.fullName);
            })
            .then(fullNames => {
                this.fullNames = fullNames;
                this.loaded = true;
            })
            .catch(err => {
                this.error = true;
                throw err;
            });
    }
}
