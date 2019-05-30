import jsforce from "jsforce";

class JSForce {
  constructor(hostname, session) {
    this.hostname = hostname;
    this.session = session;
    this.conn = new jsforce.Connection({
      serverUrl: `https://${this.session.hostname}`,
      sessionId: this.session.key
    });
  }

  async getWorkflowMetadataSummary() {
    const types = [{ type: "Workflow", folder: null }];
    try {
      const metadataSummary = await this.conn.metadata.list(types, "45.0");
      return metadataSummary;
    } catch (e) {
      return null;
    }
  }

  async getWorkflowMetadataInfo(fullname) {
    try {
      const metadataInfo = await this.conn.metadata.read("Workflow", [
        fullname
      ]);
      return metadataInfo;
    } catch (e) {
      return null;
    }
  }
}
export default JSForce;
