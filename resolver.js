/**
 * BOWDOIN COLLEGE INTERLIBRARY LOAN
 * 
 * This file contains all functionality for the ISBN and DOI resolver features, 
 * implemented in the include_resolver.html file, which is intended for use with
 * the Article, Book, Book Chapter, Table of Contents and Proceedings request forms. 
 * 
 * The DocumentType is identified, then used to display the correct wording. Attempts
 * to retrieve JSON metadata associated with the specified ISBN/DOI. If successful, 
 * populates the form with the correct information. If unsuccessful, displays an 
 * error message and prompts the user to try again. 
 * 
 * Based on the original version of the resolver which was written in early 2023, for 
 * use with the 9.0 version of the website. 
 * 
 * Date: July, 2023
 * Date (PMID resolver): February, 2024
 * @since 9.2.0
 * @author Ben Bockmann
 */

let resolve_btn = get('resolve-btn');
let submit_btn = get('submit-btn');
let full_access_btn = get('full-access-btn');
let clear_btn = get('buttonReset');
let docType = get('DocumentType').value;
let doi_or_pmid;

// When a value is put into the input field, automatically update the variable identifier.
let identifier;
get("identifier").addEventListener('change', (function () {
    if (docType === "Article" || docType === "Conference") {
        let pmid = get('identifier').value.trim();

        if (!pmid.includes("10.")){
            identifier = pmid.replaceAll("-", "");
            doi_or_pmid = "pmid";
        }

        else {
            let doi = pmid;
            doi = doi.replace("http:", "https:").replace("dx.doi.org", "doi.org");

            if (doi.charAt(doi.length - 1) == '.') {
                doi = doi.substring(0, doi.length - 1);
            }
            identifier = doi;
            doi_or_pmid = "doi";
            get("DOI").value = doi;
        }
    }
    else {
        get("DOI").value = "google books";
        identifier = get('identifier').value.trim().replaceAll("-", "");
    }
}))

//Based on the DocumentType, link buttons to correct functions and display resolver. 
submit_btn.addEventListener("click", submit);
clear_btn.addEventListener("click", function(){
    clear(1);
});

if (docType === "Book") {
    if (get('LoanTitle').value === "") {
        get('resolve-container').style = "display: block;";
        resolve_btn.addEventListener("click", (function () {
            if (identifier != undefined) {
                resolveISBN();
            }
        }));

        full_access_btn.addEventListener("click", fullAccessISBN);
        get('input-type').innerText = "ISBN";
        get("identifier").placeholder = "9781338878981";
    }
}

if (docType === "Book Chapter" || docType === "Table Contents") {
    if (get('PhotoJournalTitle').value === "") {
        get('resolve-container').style = "display: block;"
        resolve_btn.addEventListener("click", (function () {
            if (identifier != undefined) {
                resolveISBN();
            }
        }));
        full_access_btn.addEventListener("click", fullAccessISBN);
        get('input-type').innerText = "ISBN";
        get("identifier").placeholder = "9781338878981";
    }
}

if (docType === "Article" || docType === "Conference") {
    if (get("PhotoJournalTitle").value === "") {
        get('resolve-container').style = "display: block;"
        resolve_btn.addEventListener("click", (function () {
            if (identifier != undefined) {
                if (doi_or_pmid == "doi"){
                    resolveDOI();
                }
                if (doi_or_pmid == "pmid"){
                    resolvePMID();
                }
            }
        }));
        full_access_btn.addEventListener("click", fullAccessDOI);
        get('input-type').innerText = "DOI or PMID";
        get("identifier").placeholder = "10.1155/2019/9613090";
    }
}

/**
 * Makes a new HTTP Request for a JSON file to Google Books, based on the ISBN passed. 
 * Upon successful completion of the request, parses the resulting JSON file, and passes the 
 * volumeInfo section to the completeFromISBN() method. If unsuccessful, displays the 
 * error message.
 */
function resolveISBN() {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onloadend = function () {
        if (xmlhttp.status == 200) {
            let parsed = JSON.parse(this.responseText);
            if (parsed.totalItems > 0) {
                completeFromISBN(parsed.items[0].volumeInfo);
                checkFullAccess(parsed.items[0].accessInfo, "isbn", "");
            }
            else {
                displayError("ISBN");
            }
        }
        else if (xmlhttp.status >= 400) {
            displayError("ISBN");
        }
    };
    xmlhttp.open("GET", "https://www.googleapis.com/books/v1/volumes?q=isbn:" + identifier, true);
    xmlhttp.setRequestHeader("Accept", "application/vnd.citationstyles.csl+json");
    xmlhttp.send();
}

/**
 * Collects 6 bibliographic elements from the citation JSON object. Reformats 
 * author (last name, first name) and concatenates title and subtitle. Depending on
 * the request type (Loan or Article), gets the citation fields from the webpage.
 * Populates each field with the corresponding element. 
 * 
 * Displays the book cover as a thumbnail, and populates preview section.
 * 
 * @param {object} citation the parsed JSON file
 */
function completeFromISBN(citation) {
    let author;
    let title;
    let publisher = citation.publisher || "publisher not listed";
    let date = citation.publishedDate.substring(0, 4);
    let isbn = identifier;
    let source = "books.google.com";

    //format author and title
    if (citation.authors) {
        author = citation.authors[0];
        let temp = author.split(" ");
        author = temp[temp.length - 1] + ", " + temp[0];
    }

    title = citation.title;
    if (citation.subtitle) {
        title = title + ": " + citation.subtitle;
    }

    // Declare all field variables
    let author_field;
    let title_field;
    let pub_field;
    let date_field;
    let isbn_field;
    let source_field;

    // Gets the input fields from the correct form (either Loan type of Article type)
    if (docType === "Book") {
        author_field = get("LoanAuthor");
        title_field = get("LoanTitle");
        pub_field = get("LoanPublisher");
        date_field = get("LoanDate");
        isbn_field = get("ISSN");
        source_field = get("CitedIn");
    }

    else {
        author_field = get("PhotoItemAuthor"); //Book Chapter page doesn't have a book author field
        title_field = get("PhotoJournalTitle");
        pub_field = get("PhotoItemPublisher");
        date_field = get("PhotoJournalYear");
        isbn_field = get("ISSN");
        source_field = get("CitedIn");
    }

    // Populate the fields
    if (author_field) { author_field.value = author; }
    title_field.value = title;
    pub_field.value = publisher;
    date_field.value = date;
    isbn_field.value = isbn;
    source_field.value = source;

    //Update preview section
    let img_preview = get('thumbnail');
    let img_link;
    if (citation.imageLinks) {img_link = citation.imageLinks.thumbnail;}
    if (img_link) { img_preview.src = img_link; }

    get("resolve-result").children[1].innerHTML = `<h3>${title}</h3> <p>${author} <br> ${publisher}: ${date} <br>ISBN: ${isbn}</p>`

    //Display options and result, hide error message
    get('suggest-order').style = "display: block;"
    get('resolve-options').style = "display: block;";
    get('resolve-result').style = "display: flex;";
    get('resolve-error').style = "display: none;";
}

/**
 * Called when the Full Access button is clicked. Creates a link to the 
 * specified title on Google Books, then opens the link in a new window. 
 */
function fullAccessISBN() {
    window.open(("https://www.google.com/search?tbm=bks&q=" + identifier), "_blank");
}

function resolveDOI() {
    console.log("resolveDOI called");
    let doi_url = (identifier.includes("https://doi.org/")) ? identifier : ("https://doi.org/" + identifier);

    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onloadend = function () {
        if (xmlhttp.status == 200) {
            completeFromDOI(JSON.parse(this.responseText));
            checkFullAccess(JSON.parse(this.responseText), "doi", doi_url);
        }
        else if (xmlhttp.status == 404) {
            displayError("DOI");
        }
    }
    xmlhttp.open("GET", doi_url, true);
    xmlhttp.setRequestHeader("Accept", "application/vnd.citationstyles.csl+json")
    xmlhttp.send();
}

function completeFromDOI(citation) {
    console.log("completeFromDOI called");
    let journalTitle = citation["container-title"];
    let articleTitle = citation.title;
    let author_s;
    let pages = citation.page;
    let volume = citation.volume;
    let issue = citation.issue;
    let month = citation.issued["date-parts"][0][1];
    let year = citation.issued["date-parts"][0][0];
    let isxn;
    let source = "DOI";

    // Get author(s) and join in a list
    let author_list = new Array();
    if (citation.author) {
        citation.author.forEach(function (auth) {
            author_list.push(auth.given + " " + auth.family);
        })
    }
    author_s = author_list.join(", ");

    // Get either the ISSN or ISBN
    if (citation.ISSN) {
        isxn = citation.ISSN[0];
    } else if (citation.ISBN) {
        isxn = citation.ISBN[0];
    } else {
        isxn = "";
    }

    //Get the input fields
    let journal_title_field = get("PhotoJournalTitle");
    let article_title_field = get("PhotoArticleTitle");
    let article_author_field = get("PhotoArticleAuthor");
    let volume_field = get("PhotoJournalVolume");
    let issue_field = get("PhotoJournalIssue");
    let pages_field = get("PhotoJournalInclusivePages");
    let month_field = get("PhotoJournalMonth");
    let year_field = get("PhotoJournalYear");
    let isxn_field = get("ISSN");
    let source_field = get('CitedIn');

    //Populate the fields
    journal_title_field.value = journalTitle || null;
    article_title_field.value = articleTitle || null;
    article_author_field.value = author_s || null;
    volume_field.value = volume || null;
    issue_field.value = issue || null;
    pages_field.value = pages || null;
    month_field.value = month || null;
    year_field.value = year || null;
    isxn_field.value = isxn || null;
    source_field.value = source || null;
    
    if (docType === "Conference"){
        let pub = citation.publisher;
        pub_field = get("PhotoItemPublisher");
        pub_field.value = pub;
    }

    get("resolve-error").style = "display: none;";
    get("suggest-order").style = "display: none;";
    get('resolve-options').style = "display: block;";
}

let doi_oa_url;

function fullAccessDOI() {
    window.open(doi_oa_url, "_blank");
}

function resolvePMID(){
    let pmid = identifier;

    if (!(/^\d+$/.test(pmid))){
        displayError("PMID");
        return;
    }

    let pmid_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=" + pmid + "&format=json";

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onloadend = function(){
        if (xmlhttp.status = 200){
            let response = JSON.parse(this.responseText);
          
            if (response.result[pmid].articleids){
                for (let i = 0; i < response.result[pmid].articleids.length; i++){
                    if (response.result[pmid].articleids[i].idtype == "doi"){
                        let doi = response.result[pmid].articleids[i].value;
                        identifier = doi;
                        resolveDOI();
                        return;
                    }
                }
                displayError("PMID");
                return;
            }
            else{
                displayError("PMID");
                return;
            }
        }

        if (xmlhttp.status == 404){
            displayError("PMID");
        }
    };

    xmlhttp.open("GET", pmid_url, true);
    xmlhttp.setRequestHeader("Accept", "application/vnd.citationstyles.csl+json");
    xmlhttp.send();
}

/**
 * Checks the viewability attribute of the citation. If value is "ALL_PAGES",
 * there is a full access copy on Google Books, so the Full Access button is shown.
 * @param {object} citation the parsed JSON file
 * @param {string} type whether to check for ISBN or DOI 
 * @param {string} doi_url the url for the DOI
 */
function checkFullAccess(citation, type, doi_url) {
    get("full-access-btn").style = "display: none;";

    // check for Book request
    if (type === "isbn") {
        if (citation.viewability === "ALL_PAGES") {
            get("full-access-btn").style = "display: inline-block;";
        }
    }

    if (type === "doi") {

        let oa_url = 'https://bg.api.oa.works/find?id=' + identifier;

        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onloadend = function(){
            if (xmlhttp.status == 200){
                let response = JSON.parse(this.responseText);
                if (response.url){
                    get("full-access-btn").style = "display: inline-block;";
                    doi_oa_url = response.url;
                }
                else{
                    console.log("no open access");
                }
            }
            else if (xmlhttp.status == 404){
                console.log("no open access");
            }
        };
        xmlhttp.open("GET", oa_url, true);
        xmlhttp.setRequestHeader("Accept","application/vnd.citationstyles.csl+json");
        xmlhttp.send();
    }
}


/**
 * Displays the error message, and hides the option and result divs. 
 * Clicks the Clear Form button to reset form fields.
 */
function displayError(id_type) {
    clear(0);
    error_msg = get("resolve-error");
    error_msg.innerText = "There was a problem retrieving this " + id_type + ". Please try again, or complete the form below."
    error_msg.style = "display: block;";
    // TODO: reset DOI field
}

/**
 * Called when user clicks 'clear' button, or if the resolver 
 * fails to resolve the given identifier. If the resolver fails, the
 * input fields are cleared individually. Otherwise, the URL is 
 * replaced and the page is reloaded.
 * @param {int} refresh 0 (refresh page) or 1 (clear fields)
 */
function clear(refresh){
   
    if (refresh){
        location.reload();
        // let title = document.title.replace("Request", "").trim();

        // let links = document.getElementsByClassName("nav-item dropdown")[0].children[1].children;
        // for (let i = 0; i < links.length; i++) {
        //     console.log("clear");

        //     if (links[i].innerText === title) {
        //         // window.location = links[i].href;
        //         window.location = "https://bowdoin.edu";

        //     }
        // }
    }
    
    else{
        // if the thumbnail and submit buttons are showing, hide them
        // clear each input field. 
        get("resolve-options").style = "display: none";
        get("resolve-result").style = "display: none";

        let section = document.getElementsByTagName("section")[1];

        let inputs = section.getElementsByTagName("input");

        for (let i = 0; i < inputs.length; i++){
            let curr = inputs[i];
            if (!(curr.id == "user-date")){
                curr.value = "";
            }
        }

        get("Notes").value = "";
        get("CitedIn").value = "";
    }
       
}

function submit() {
    get("buttonSubmitRequest").click();
}

get("suggest-type").addEventListener("change", updateOrderRequest);

function updateOrderRequest(){
    get("WantedBy").value = get("suggest-type").value;
}