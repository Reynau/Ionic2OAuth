import { Component } from '@angular/core';
import {NavController, Platform, AlertController } from 'ionic-angular';

declare let window: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private fibAuthUrl = 'https://api.fib.upc.edu/v2/o/authorize/';
  private fibTokenUrl = 'https://api.fib.upc.edu/v2/o/token/';

  private client_id = 'CLIENT_ID';
  private client_secret = 'CLIENT_SECRET';
  private auth_code = null;

  constructor(public navCtrl: NavController,
              private platform: Platform,
              public alertCtrl: AlertController) {

  }

  public login () {
    let _self = this;
    this.platform.ready().then(() => {
      this.fibLogin().then(
        authCode => _self.authenticate(authCode),
        error => _self.handleAuthError(error)
      );
    });
  }
  private authenticate(authCode: string) {
    let _self = this;
    this.auth_code = authCode;
    this.fibAuthenticate().then(
      data => _self.handleAuthToken(data),
      error => _self.handleAuthError(error)
    );
  }

  public fibLogin(): Promise<any> {
    const oauthUrl = this.fibAuthUrl + "?client_id=" + this.client_id + "&response_type=code&state=random_state_string";

    return new Promise(function(resolve, reject) {
      let browserRef = window.cordova.InAppBrowser.open(oauthUrl, '_blank', 'location=yes');
      browserRef.addEventListener("loadstart", (event) => {
        if ((event.url).indexOf("http://localhost/callback") === 0) {
          browserRef.close();
          let responseParameters = ((event.url).split("?")[1]);
          let code = HomePage.getAuthCode(responseParameters);
          if (code == null)
            reject("Problem authenticating with FIB");
          else
            resolve(code);
        }
      });
      browserRef.addEventListener("loaderror", (error) => {
        reject("The FIB sign in flow was canceled. Error: " + error.message);
        browserRef.close();
      });
    });
  }
  private fibAuthenticate(): Promise<any> {
    let _self = this;
    return new Promise(function(resolve, reject) {
      let xhr = new XMLHttpRequest();

      xhr.open("POST", _self.fibTokenUrl, true);

      xhr.onload = function (e) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(xhr.statusText);
          }
        }
      };
      xhr.onerror = function (e) {
        reject(xhr.statusText);
      };

      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

      let params = 'grant_type=authorization_code&'
        + 'redirect_uri=http://localhost/callback&'
        + 'client_id=' + _self.client_id + '&'
        + 'client_secret=' + _self.client_secret + '&'
        + 'code=' + _self.auth_code;

      xhr.send(params);
    })
  }

  private handleAuthToken(data: string) {
    alert(data);
  }
  private handleAuthError(error) {
    alert(error);
  }

  private static getAuthCode(params: string): string {
    let responseParameters = params.split("&");
    for (let i = 0; i < responseParameters.length; i++) {
      let urlElem = responseParameters[i].split("=");
      if (urlElem[0] === 'code') return urlElem[1];
    }
    return null;
  }
}
