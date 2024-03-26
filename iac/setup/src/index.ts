import * as pulumi from "@pulumi/pulumi";


export const environment = pulumi.getStack();
export const tabiyaDomainName = "tabiya.tech";
export const currentDomainName = `${environment}.${tabiyaDomainName}`;
export const backendURl = `https://${currentDomainName}/api`;
export const authURL = `https://${currentDomainName}/auth`;
