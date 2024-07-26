---
title: Handling Laravel file uploads using S3.
date: 2023-06-21
description: Step-by-step guide on how to handle file uploads to AWS S3 in a Laravel application.
draft: false
---

One of the most lovable traits of Laravel is the ease of integrating services like authentication,
mailing, file uploads, etc. which are otherwise very cumbersome to setup from scratch. For that
matter, let's look into how we setup file uploads using AWS S3 in Laravel.

Firstly, we create a new S3 bucket in our AWS console using the default settings. After creating
the bucket, we add a new IAM user so that we can access the S3 bucket from our Laravel application.
The new IAM user is granted permission for `S3FullAccess`, i.e. the user can perform all CRUD
operations. After the user is created, we copy the access and secret keys and put them corresponding
to `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Finally, we need to install the necessary
dependencies &mdash;

```sh
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

Now, we can use the `Storage` class to upload and retrieve files to and from S3.

Now, let's look at how we can upload a file to S3 and retrieve it as well. It's important to note
that while submitting a form with files, we must make sure that the `enctype` of the form is set to
`multipart/form-data`. Failing to mention this wouldn't allow the request object to access the file.
The code snippet shown below can be used as a reference on how to access the file using the request
object and uploading the same to S3.

```php
// get the file using the file input's name
$file = $request->file('upload');

// store the file to S3 bucket's upload folder
// this would return the file path, e.g. uploads/filename.ext
$s3Path = $file->store('uploads', 's3');

// this value needs to be used to view the file within the application
$filename = basename($s3Path);
```

After uploading a file, if we go to the S3 console, we can see the the file being uploaded to the
**uploads** folder. However, we try to open the file URL in the browser, we can see a **Access Denied**
XML. If you recall, while creating the new S3 bucket, we've used the default setting. And the default
settings blocks public access to the S3 bucket and its contents. This is for security purposes and so
we'll keep it as it is. The Laravel `Storage` class provides an easy way to view the uploaded files
within our application. Firstly, we need to implement a `GET /uploads/{filename}` route so that our
uploads can be viewed using this route. The controller for this route can be like &mdash;

```php
public function uploads(String $filename) {
	return Storage::disk('s3')->get('uploads/' . $filename);
}
```

Finally, if we go to `/uploads/{filename}` by passing the value of the `$filename` variable, we can see
our uploaded file. So, with just a few lines of code, a file upload functionality is ready to be used
in a Laravel application.
