If you do not have a mongodb admin account, please create one. You can do so by running the following commands in the mongo shell:
1. console 2 run: `use admin`
2. console 2 run: 
   - Change user and pwd to something difficult 
```
db.createUser({
  user : "admin",
  pwd  : "pass",
  roles: [
    { 
      role: 'root', db: 'admin'
    }
  ]
});
```

Another layer of protection we can add is on the server side, only allowing the application server to connect to DB. 
This is by configuring the firewall iptables:

```
iptables -A INPUT -s <ip-address> -p tcp --destination-port 27017 -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -d <ip-address> -p tcp --source-port 27017 -m state --state ESTABLISHED -j ACCEPT
```
In this case the <ip-address> would be our application server (velocity)

Lastly, we will need to drop all other incoming/outgoing traffic:
```
iptables -P INPUT DROP

iptables -P OUTPUT DROP
```
