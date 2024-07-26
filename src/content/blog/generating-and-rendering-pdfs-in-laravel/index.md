---
title: Generating and rendering PDFs in Laravel.
date: 2023-06-26
description: Step-by-step process of using barryvdh/laravel-dompdf composer package to programmatically generate and render PDFs in Laravel.
draft: false
---

We can easily generate PDFs in Laravel using the package `barryvdh/laravel-dompdf`. To install it
to an application, just run the command &mdash;

```sh
composer require barryvdh/laravel-dompdf
```

After installing the package, we need to add it to `providers array` in `config/app.php` as
`BarryVdh\Barryvdh\DomPDF\ServiceProvider::class`.

Now we need to create a blade template that would be used as a markup for the PDF that we want to generate.
Let's say our template looks like &mdash;

```php
// pdfs/example.blade.php
@extends('layouts.pdf')

@section('title', 'Example PDF')

@section('main')
  <h1>hello, world!</h1>
@endsection
```

As you can see, the above template just displays a hello world message. To generate a PDF using this template,
the controller would be &mdash;

```php
// ... controller code
$pdf = Pdf::setPaper('a4')->loadView(
  'pdfs.example'
);

// save the pdf output in s3
// this returns a boolean -> true if upload is successful else false
Storage::disk('s3')->put("pdfs/$filename.pdf", $pdf->output());

// finally we retrieve the pdf file path to render in browser
// since s3 files are private by default we need to create a route to retrieve the file
$pdfFileUrl = env('APP_URL')."/pdfs/$filename.pdf";
```

To render the the generated PDF in the browser using the file url, we need create a controller like &mdash;

```php
public function pdfs(string $filename) {
  $file = Storage::disk('s3')->get("pdfs/$filename");
  $header = [
    'Content-Type' => 'application/pdf',
    'Content-Disposition' => 'inline;filename="' . $filename . '"'
  ];
  return response($file, 200, $header);
}
```

Now if we go to the url `/pdfs/filename.pdf`, we can see the generated PDF.

To pass data to the PDF template, we can just pass an array as the second argument of `loadView`. The code
snippet shown below can be taken as a reference for this &mdash;

```php
// ...
$pdf = Pdf::setPaper('a4')->loadView(
  'pdfs.example',
  ['user' => Auth::user()->name]
);
// ...
```

Let's now try adding image assets to the PDF. We pass a `image` field to the data array passed to `loadView`
and pass filesystem image to our PDF template. On rendering the generated PDF, we'll see a
**Image not found or type unknown** error.

This is because the package only supports **base64** encoded images.
To fix the issue, we can create an utility function to encode any image passed to the PDF template to base64
format. Let's use the `@php` directive to create a function in the template itself. The code snippet below can
be taken as a reference for this &mdash;

```php
@php
  function base64Encode(string $imgPath) {
    $disk = Storage::disk('local');
    $imgFile = $disk->get($imgPath);
    $extension = pathinfo($disk->path($imgPath), PATHINFO_EXTENSION);
    return "data:image/$extension;base64," . base64_encode($imgFile);
  }
@endphp
```

Finally, if you check the PDF rendered after encoding the image, we can see it in the PDF.
