# Unique-Identifier-Resolver

## About
This project aims to streamline the user experience on the ILLiad request pages (Article, Book, Book Chapter, Table of Contents and Proceedings). Currently, the supported unique identifiers include ISBN, DOI, and PMID. Citation metadata is retrieved via the Google Books API and doi.org API. Full text and open access checking is also supported, using Google Books and Open Access Works. 

## Implementation and Customization
To incorporate this project into your own ILLiad webpages, after downloading the files to your server, simply place the `include_resolver.html` file between the header and form content on each request page:
```
<#INCLUDE filename="include_resolver.html">
```
Then, in  `resolver.js`, customize the form fields which are to be automatically populated with the citation metadata in `completeFromISBN()` and `completeFromDOI()`.

## Contact
For questions or comments, please email Ben Bockmann (Bowdoin ILL Web Services Developer) at bbockmann@bowdoin.edu or Guy Saldanha (Bowdoin ILL Supervisor) at gsaldanh@bowdoin.edu.
