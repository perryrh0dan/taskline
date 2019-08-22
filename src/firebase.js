const firebase = require("firebase-admin");

const cert = {
  type: "service_account",
  project_id: "todo-83ef9",
  private_key_id: "af094afbb683d6cafabdc4c39a7458032f5eb75f",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCUJ3oOwqTqUR8k\n3kNa6svjyVREFwojKGkpG89wLwamQAoWU6VJIGCuM6bV8OeCEexUSFhuVwkKG2zz\nwKTno9L5Zve0+92rSqQuM3hIRqLNEz+xECHuEwP6KjVfvkFaQ4xHibbyND7u2zuz\n2/mwUO0wdTiniFbmtHuCYA0v29GYRpsXh2shwhGKnTRa1j16DwAS2v4z4GkclSPy\nQwAB/RL+lFpPQkxf00RBBmmH+CpRCJo4ebB8dtFHrkfV0cgzkmDJeDSYa6xid6Sb\nq7orY80tFYy7SKt2oCLjwXHFxnIOcg5Xba8h7/QDi3WxOYrRXjgsp2YZEt5iIaww\nRWSsvim5AgMBAAECggEACm5D5GGLpw88EDMkodq+Rrs1F0nAX6mBZRc9dRc45bnE\nTz5NxXnyl839W1QUY8hFD8miJ26YRwf94gsSCr7/F3d9tCMEppuUNvtOGiSWL+lz\n7NCHQWt0UCFQ1BaHvZLcGWmwO2ac3ns8vYgcxCJs3wigJJqip6gh7ZPVCdjboL4o\naJY2p3woy+nsngd+IjdPsTOduA+I+P8BpJThKbwjAEjNOITQ5Wk10WKRrn3twJiQ\nEA25y0U0My7JtmHdtQ0UHgsAAJqHEafblrPyqbczCJDFFMaFmvHKp7KP1vfTAMsM\nY6/IEUBgrlLvd2O3M5hhRVmsDMmW2LHS9Wi/fBqvowKBgQDI1+RBaiSiPfDvYwYU\n/NKKEVdN50ANS51+GJNlC/9fUgesz8cqxdWlk7aw46FsIJ0wyk0GbfsLPNQHhp3f\nOnpMpPhYBmejs987sGmkgRiDoTdwv0a1oYwKtg88LmUSbMeEDi1HGTyWROrzVNts\nlrK5l5LwqOIB7xuJpEOQ6KtuWwKBgQC811MACJtk4DtjqzmddML10b/Yxlnk/+ae\nRD/LmIDxWjEU/6ucVmnDkqcptJ9Myx6X9lmzt1rAlth+IRN+EEfjrYGKSkrY5W1F\nITC1o4htBJz3Fhbx1ujaCgUrb7qzjBeE5C5zCjDMYDkoXhD/mjpOqpOsdOB+UE95\nSpUPd6GsewKBgF886NMQJyD8KFUL6uVm4dtwz6p0Xw4u7hbORo6i+szTlCohOPuS\nZnYmrnoA5xnj+UYamB3VZzbz+EM9VX12OGpBzDXJi7m34MJoLCBCy0IX37dKLJiS\na1rk7CKIiYsMJCv9oQDW+cD0G0mZ0pcSetvBAX+3RbzPCorhZty/SBODAoGAZ4WH\nC7KsNU2zYP0htY6nvgiBKj36U85xR3vUmTD+JtExrPhHxImeq0b++p744SlMmTPE\nkv/F8WQARIyvWeFk94xLQltd0q9bCpWaVUjT5iesQMvMQkF1Hup1UQ2MBRecYQ6R\n5CDHBZMOYnHG0chjhHKAR/8+fiBaoPxg4LzNVXcCgYAW4eKYSEG/NhmdGK3qgTnT\n3BEVajGlJ3s5Z3tEK7uIR2RiUDMhQfe69tV+KnCJvqtt+kuBLc11VRSg9DSXDqld\nldbArTieD1Wg+++F8/1sLOI0FbadDyHln7cW8QoR90vkZEY7ayZRoefDoj+bx2rS\n0x0h0Th4EP30fnLWWk6bpA==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-86yi4@todo-83ef9.iam.gserviceaccount.com",
  client_id: "115500534921277044483",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-86yi4%40todo-83ef9.iam.gserviceaccount.com"
};

class Firebase {
  constructor() {
    firebase.initializeApp({
      credential: firebase.credential.cert(cert),
      databaseURL: "https://test-23cfc.firebaseio.com"
    });
    this.db = firebase.firestore();
  }

  _parse(data) {
    // let result = {}
    let result = [];

    for (let key in data) {
      // skip loop if the property is from prototype
      if (!data.hasOwnProperty(key)) continue;

      var obj = data[key];
      // result[key] = Object.assign({}, obj)
      result.push(Object.assign({}, obj));
    }

    return result;
  }

  set(data) {
    let pureData = this._parse(data);

    this._updateCollection("storage", pureData);
    // this._deleteCollection("storage").then(() => {
    //   pureData.forEach(element => {
    //     this.db
    //       .collection("storage")
    //       .doc(element._id.toString())
    //       .set(element);
    //   });
    // });
  }

  setArchive(data) {
    let pureData = this._parse(data);

    this._deleteCollection("archive").then(() => {
      pureData.forEach(element => {
        this.db
          .collection("archive")
          .doc(element._id.toString())
          .set(element);
      });
    });
  }

  get() {
    let self = this;

    return new Promise(function(resolve, reject) {
      self.db
        .collection("storage")
        .get()
        .then(content => {
          let data = content.docs.map(doc => doc.data());
          let result = {};
          for (let i = 0; i < data.length; i++) {
            result[data[i]._id] = data[i];
          }
          resolve(result);
        })
        .catch(error => {
          reject();
        });
    });
  }

  getArchive() {}

  _updateCollection(path, dataArray) {
    let self = this;
    let batch = this.db.batch();

    return new Promise(function(resolve, reject) {
      dataArray.forEach(element => {
        // Create a ref
        var elementRef = self.db.collection(path).doc(element._id.toString());
        batch.set(elementRef, element);
      });

      batch
        .commit()
        .then(() => {
          resolve();
        })
        .catch(error => {
          reject();
        });
    });
  }

  _deleteCollection(path) {
    // Get a new write batch
    let batch = this.db.batch();

    return new Promise(function(resolve, reject) {
      firebase
        .firestore()
        .collection(path)
        .listDocuments()
        .then(val => {
          val.map(val => {
            batch.delete(val);
          });

          batch.commit().then(() => {
            resolve();
          });
        })
        .catch(error => {
          reject();
        });
    });
  }
}

module.exports = Firebase;
