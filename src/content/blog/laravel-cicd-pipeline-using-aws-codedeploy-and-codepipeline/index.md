---
title: Laravel CI/CD pipeline using AWS.
date: 2023-07-03
description: Step-by-step implementation of a continuous integration/continuous delivery pipeline of a Laravel codebase in GitHub using AWS CodeDeploy and CodePipeline.
draft: false
---

What's actually a CI/CD pipeline? Why do we need it? These stuff must be very clear before setting them up for a project.
CI/CD stands for **Continuous Integration/Continuous Delivery**. As a one liner understanding, CI/CD is the automation of
the build process after shipping new code to a repository. This automation mechanism makes sure that after a new commit
is made to a repository, a build process is triggered immediately and changes made to the codebase are reflected in the
server after the build is complete.

Setting up a CI/CD pipeline can be very confusing. While I was tasked upon for the same in a Laravel project hosted on a
EC2 instance using AWS **CodeDeploy** and **CodePipeline** services, I found it very difficult to implement. Resources in
the internet sometimes aren't sufficient enough, sometimes they've outdated content and many a times prone to errors. So,
I thought of documenting the entire implementation process so that devs out there can skip the headache.

Firstly, we need to go to the IAM dashboard and go to Roles and create a new Role. In step 1, we select AWS service as our
trusted entity and CodeDeploy as our use case. In step 2, we can see the **AWSCodeDeployRole** policy being attached to our
Role. In step 3, we add a name to the Role, say **CodeDeployServiceRole**.

After creating this Role, we go to the CodeDeploy Service dashboard and create a new application. We name the application
as **TestAppCodeDeploy** and select **EC2/On-premises** as our compute platform. This creates a CodeDeploy application for which
we now have to create a **Deployment Group**.

We add a name to the Deployment Group, say **TestAppCodeDeployGroup**, and attach the **CodeDeployServiceRole** created above
as a service role to the Deployment Group. After that we select In-place Deployment type, add our existing EC2 instance
to the Environment configuration, and use default settings for rest of the options except for Load balancer settings
where we **uncheck** the Enable load balancing.

This will create a CodeDeploy Group which we need to attach to a CodePipeline instance in the deploy stage. To create a
CodePipeline instance, go to the CodePipeline dashboard and click on new pipeline. Add a name to the pipeline and keep
rest of the settings as default. The Service Role name of the pipeline is automatically generated from the name of the
pipeline. However, we can customise with a different name or a manually created Role. After this we need to connect our
Github repository to the pipeline. If our repository isn't configured to AWS, we need to Connect to Github to add it.
After adding the repository, we need to enter the repository name, for example **username/repository_name** and then select
the branch that we want to integrate the pipeline with. After clicking next, we'll be asked to add a build stage.
But since we have our CodeDeploy configuration, this step can be skipped and in deploy stage, we can add our
CodeDeploy application and Deployment Group.

Now, if we click on next and confirm creation of a new pipeline, we'll be able to see that our source is integrated
successfully but the Deployment stage throws error <strong class="text-red-500">CodeDeploy agent was not able to receive the lifecycle event.
Check the CodeDeploy agent logs on your host and make sure the agent is running and can connect to the CodeDeploy server</strong>.
This is because our EC2 instance isn't configured to pull in the new changes from the Github repository using this pipeline.
To understand in detail, when we push a new commit to the repository, the pipeline bundles the new code to an S3 object which
is pulled by the `codedeploy-agent` that should be run in background in the EC2 instance. Thus we need to setup our EC2
instance to integrate the deployment stage successfully. To setup our EC2 instance to run the deployment stage successfully,
we need to go to the IAM dashboard and create a new Role that has the policies **AmazonEC2RoleforAWSCodeDeploy** and
**AmazonS3FullAccess** attached to it. These two policies would allow our EC2 instance to pull new updates from the CodePipeline.
Let's name the role as **CodeDeployEC2S3AccessRole**. After adding this Role we need to attach it to the EC2 instance. This can
be done by going to the EC2 dashboard, and adding the Role to the instance by going to its Actions Menu → Security → Modify IAM Role.
Our work on the AWS Management Console is over.

Now, we need to install the `codedeploy-agent` in our instance. This can be done by running the commands (make sure this is run in
Ubuntu Linux Server; for other distros the package install commands are different) &mdash;

```sh
sudo apt update
sudo apt install ruby-full
sudo apt install wget
cd ~
wget https://aws-codedeploy-ap-south-1.s3.ap-south-1.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
```

This will install the `codedeploy-agent` to the EC2 instance. We can verify the installation by running the command
`sudo service codedeploy-agent status`.

Finally, we need to add a **appspec.yml** file to our repository. This file would define the scripts to run for each lifecycle
event of the CodeDeploy Service. In our case, the file would look something like &mdash;

```yaml
version: 0.1
os: linux
files:
  - source: /
    destination: /var/www/html
file_exists_behavior: OVERWRITE
hooks:
  BeforeInstall:
    - location: aws/scripts/clear-cache.sh
      runas: ubuntu
      timeout: 300
  Install:
    - location: aws/scripts/install-dependencies.sh
      runas: ubuntu
      timeout: 300
  AfterInstall:
    - location: aws/scripts/after-install.sh
      runas: ubuntu
      timeout: 300
  ApplicationStart:
    - location: aws/scripts/start-application.sh
      runas: root
      timeout: 300
  ApplicationStop:
    - location: aws/scripts/stop-application.sh
      runas: root
      timeout: 300
```

Also, the scripts for each lifecycle event would look like &mdash;

1. aws/scripts/clear-cache.sh

```bash
#!/bin/bash
cd /var/www/html
php artisan optimize:clear
```

2. aws/scripts/install-dependencies.sh

```bash
#!/bin/bash
cd /var/www/html
composer install
pnpm install
```

3. aws/scripts/after-install.sh

```bash
#!/bin/bash
cd /var/www/html
pnpm run build
```

4. aws/scripts/start-application.sh

```bash
#!/bin/bash
sudo service nginx restart
```

5. aws/scripts/stop-application.sh

```bash
#!/bin/bash
sudo service nginx stop
```
