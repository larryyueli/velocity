# Velocity

## Contents

0. [Introduction](#introduction)
1. [Setup](#quick-setup)

## Introduction

Velocity is a CS organizational website, offering multiple kinds of developmental environments that can be used by both classes and groups.

## Screenshot
![Alt text](/Docs/Screenshots/overview.png?raw=true "Overview Image")
![Alt text](/Docs/Screenshots/board.png?raw=true "Board Image")
![Alt text](/Docs/Screenshots/backlog.png?raw=true "Backlog Image")
![Alt text](/Docs/Screenshots/analytics.png?raw=true "Analytics Image")
![Alt text](/Docs/Screenshots/management.png?raw=true "Management Image")
![Alt text](/Docs/Screenshots/milestone.png?raw=true "Milestone Image")
![Alt text](/Docs/Screenshots/story.png?raw=true "Story Image")

## Setup

These instructions will guide you through setting up an instance of Velocity.

Before continuing, make sure that you have the dependencies `nodejs`, `npm`
and `mongodb` installed.

0. Clone the repository.

  ```
  $ git clone https://github.com/larryyueli/velocity.git
  ```

1. Install the Node module dependencies.

  ```
  $ cd velocity
  $ npm install
  ```

2. Configure server settings and SSL Certification
   * Note: To run this application locally you do not have to change any configuration settings.
    1. Run the setup script, which will ask you for your administrator account information.
    ```
    $ npm run setup
    ```
    or
    ```
    nodejs Scripts/setup.js
    ```
    1. Go to [velocity.config](velocity.config)
    2. Change the following fields to your setup.https and http ports.
    * `hostName` - Enter the public web-address for this website, ex (www.velocity.com) (default: localhost)
    * `httpPort` - http port (default: 8000)
    * `httpsPort` - https port (default: 8080)
    * `maxSessionAge` - session timeout in seconds (default: 1 hour = 3600 seconds)
    * `db_host` - mongodb database server address (default: localhost)
    * `db_port` - mongodb connection port (default: 27017)
    * `db_name` - name of appplication's database within mongodb (default: velocity_UNKNOWN)
    * `db_admin_name` - db admin account name (default: admin)
    * `db_admin_password` - db admin account password (default: password)
    * `password` - password used for encryption and session security
    3. You can change the session expiration time(maxSessionAge), by default it is set to 1 hours. The number you enter represents the timeout in seconds, so 1 hour = 3600 seconds.
    4. Replace the default self-signed SSL Certificates with your certificates. The certificates are placed in Keys/private.key and Keys/cert.crt Make sure to use the same names.

    To generate your own Self-Signed Certificate, Run the following script on your shell (terminal):
    - Note: Make sure to have openssl installed on your shell.
    ```
    $ sh Scripts/certificateGenerator
    ```

3. To secure MongoDB authentication and advanced firewall rules follow the steps provided under [Docs/MongoDb-Security](Docs/MongoDb-Security.md).
   - Note: You can skip this step if you are running this in a local environment (localhost).

4. You can now launch the server by running

  ```
  $ npm start
  ```

  If haven't changed any settings you should now be able to access Velocity by visiting
  https://localhost:8080 in your browser.

5. After you have set up an admin account, load the Velocity application and log in with the account that you created. You now have a working instance of Velocity which you can use.

## Contact

If you have a question, find a bug, need a feature, or want to contribute, please open a ticket on our github page

## Credits

Velocity's development started at and has been supported by the University of Toronto Mississauga. Below is a list of the contributors so far.

Ahmed Qarmout: since January 2018
Ramy Esteero: since January 2018
Sergey Gayvoronskiy: since January 2018

Supervisor: Larry Yueli Zhang
