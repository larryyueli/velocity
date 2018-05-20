Step 1 Create MongoDB administrator account:
1. console 1 run: `mongod --port 27017 --dbpath /data/db`
2. console 2 run:`mongo --port 27017 velocity`
3. console 2 run: `use admin`
4. console 2 run: 
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

Step 2 Create application server account (Velocity database)

1. console 1 run: `mongod --auth --port 27017 --dbpath /data/db`
2. console 2 run: `mongo -u admin -p pass --authenticationDatabase admin`
3. console 2 run:
   - Change user and pwd to something difficult
```
db.createUser({
  user : "appuser",
  pwd  : "apppass",
  roles: [
    { 
      role: 'readWrite', db: 'velocity'
    }
  ]
});
```

Now we have successfully created an authenticated mongodb. Only with this account can the application server read/write to the db.

When initializing the db in Backend/db.js, Once the db connection is open, use this function below to authenticate, remember to change the `'appuser', 'apppass'` arguements to the velocity account you have created:
```
db.authenticate('appuser', 'apppass', function(err, result) {
  ...
});
```

Run the mongod instance like this for authentication:
`mongod --auth --port 27017 --dbpath /data/db`


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
