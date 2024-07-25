/***** Dify * start *****/

const Dify_APIKEY = "XXXXXXXXXXX";
const BASE_URL = "https://api.dify.ai/v1";

// Workflow Execution
async function runWorkflow(inputs, responseMode, user) {
    const url = `${BASE_URL}/workflows/run`;
    const headers = {
      "Authorization": `Bearer ${Dify_APIKEY}`,
      "Content-Type": "application/json"
    };
    const data = {
      inputs: inputs,
      response_mode: responseMode,
      user: user
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
  
      if (response.ok) {
        if (responseMode === "blocking") {
          const result = await response.json();
          if (result.data && result.data.outputs && result.data.outputs.text) {
            $('#loading').fadeOut();
            return result.data.outputs.text;
          } else {
            console.error("Error: 'text' not found in the API response.");
          }
        } else if (responseMode === "streaming") {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let chunk;
          while (!(chunk = await reader.read()).done) {
            console.log(decoder.decode(chunk.value));
          }
        }
      } else {
        console.error(`Request failed with status code ${response.status}`);
      }
    } catch (error) {
      console.error("Fetch error: ", error);
    }
  }

window.onload = function() {
    document.getElementById('input-form').addEventListener("submit", async (event) => {
        event.preventDefault();
        const inputTextAreaBib = document.getElementById('textarea1').value;
        $('#loading').show();
        const inputs = {input: inputTextAreaBib};
        const responseMode = "blocking";
        const user = "example_user";

        const result = await runWorkflow(inputs, responseMode, user);
        $('#ai_chart').html(result);

    });
}

/***** Dify * end *****/



/***** main setting * start *****/

// tooltip
$(document).ready(function(){
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
});

//----------------------------------------------------------------------------------------------------------
// declaration of regular expressions（OK to have a single-byte space on either side of the =, like '* = {}'）
//----------------------------------------------------------------------------------------------------------
// ❶ title={}：exclude booktitle
const titleRegex = /(?<![a-zA-Z])title\s*=\s*\{(.+?)\}/;

// ❷ author={}：
const authorRegex = /author\s*=\s*\{(.+?)\}/;

// ❸ journal={}, booktitleRegex={}
const journalRegex = /journal\s*=\s*\{(.+?)\}/;
const booktitleRegex = /booktitle\s*=\s*\{(.+?)\}/;

// ❹ year={}：
const yearRegex = /year\s*=\s*\{(.+?)\}/;

// ❺ year={****}：only four-digit numbers
const year_4Digit_Regex = /^\d{4}$/;

// ❻ year={(参照2024/02/18)}：four digits in a string
const fourDigitRegex = /\d{4}/g;

// ❼ four digits in a sentence ex.)参照2024/2/18
const fourDigit_b_Regex = /\b\d{4}\b/g;

// ❽ find 'http'
const httpRegex = /^http/;



/**
 * data storage
 * ① title duplicate check
 * ② store author information for changing variables, and add the number of occurrences after the name if it is duplicated  ex). tanaka2
 * ③ add year to array
 * @param {string} BibText // contents of the textarea
 * @param {string} area // show warning above for 'alertArea1' / below for 'alertArea2'
 * @returns {string[]}  ① title information, ② author information ③ year information
 */
function SplitBib(BibText,area){
    let errorJudge = false; // flag for exception handling
    let errorMessages = ""; // variables for strings thrown together with exceptions

    // store separated by @*{*}
    let splitText = BibText.split("@").filter(p => p.trim() !== "");

    // store title and first author in set
    let titleSet = new Set();
    let authorArr = [];

    // count the number of occurrences of author
    let authorCountMap = new Map();

    let yearArray = [];
    let countBib = 0; // variable that counts the number of data in Bib format for error display


    const alertArea1 = $('#alertArea');
    const alertArea2 = $('#alertArea2');

    // loop through an array of paper information
    for (let eachBib of splitText) {
        countBib += 1;

        /***** ① title duplicate check * start *****/

        // get regular expression: title = {*} string
        let title = eachBib.match(titleRegex);

        if(title !== null){
            title = eachBib.match(titleRegex)[1];

            // duplicate check for publication of the same paper
            if (titleSet.has(title)  === true) {
                errorJudge = true;
                // error due to duplicate paper
                // throwing errors to RewriteVariable()
                errorMessages += '<div class="alert alert-danger">「' + title + '」<br>　論文が重複しているので、1つだけにしてください</div>';

                // move to the error location
                // cursorPosition = BibText.indexOf(title);
                // document.getElementById('textarea1').setSelectionRange(cursorPosition,cursorPosition);
                // document.getElementById('textarea1').focus();
                //throw '<div class="alert alert-danger">' + title + '<br>論文が重複しているので、1つだけにしてください</div>';

            } else {
                // add title to set
                titleSet.add(title);
            }
        }else{
            errorJudge = true;
            // error due to lack of title information
            // throwing errors to RewriteVariable()
            errorMessages += '<div class="alert alert-danger">' + countBib + '番目のBibのタイトル情報がありません</div>';
        }

        /***** ① title duplicate check * end *****/



        /***** ② acquiring author information + counting the number of author occurrences (preparing to rename the bib variable) * start *****/

        // get string of author={*}: regular expression: 
        let author = eachBib.match(authorRegex);

        if(author !== null){
            author = eachBib.match(authorRegex)[1];

            // get a first author
            let firstName;
            if (author.includes(" and ") === true) {

                //if there is a comma ",", assign the first name by splitting with the comma ","　：（例）Tanaka, Taro and Yamada, Hanako...
                if(author.includes(",") === true){
                    firstName = author.split(",")[0];
                }else{

                    // split with " and " to get first author
                    firstName = author.split(" and ")[0];
                }
                
                /***** processing via api * start *****/


                /***** processing via api * end *****/
            } else {
                // if there is no "and", assign the first name separated by ","：（例）Tanaka, Taro Yamada Hanako...
                firstName = author.split(",")[0];
            }

            // count the number of occurrences of author
            if (authorCountMap.has(firstName)) {
                // + 1 if author already appears, 
                authorCountMap.set(firstName, authorCountMap.get(firstName) + 1);
            } else {
                // 1 on first appearance
                authorCountMap.set(firstName, 1);
            }

            // add a number for the number of occurrences after the name if the author is duplicated
            if (authorCountMap.get(firstName) > 1) {
                // name + number of occurances
                firstName = firstName + authorCountMap.get(firstName);
            }
            // add author to array
            authorArr.push(firstName);
        }else{
            errorJudge = true;
            // error due to no author
            // throwing errors to RewriteVariable()
            if(title !== null){
                errorMessages += '<div class="alert alert-danger">「'+ title + '」<br>　著者情報がないので、追記してください</div>';
            }else{
                errorMessages += '<div class="alert alert-danger">著者情報がないので、追記してください</div>'
            }
        }

        /***** ② acquiring author information + counting the number of author occurrences (preparing to rename the bib variable) * end *****/


        
        /***** ③ Check bibliographic information (not applicable for @misc) * start *****/

        if(journalRegex.test(eachBib) === false && booktitleRegex.test(eachBib) === false && area === 'alertArea1'){
            const warningJournal = '<div class="alert alert-warning">「' + title + '」に<br>　書誌情報がないので、追記することをオススメします</div>';

            // yellow warning sign
            alertArea1.html(alertArea1.html() + warningJournal);
        }

        /***** ③ Check bibliographic information (not applicable for @misc) * end *****/


        
        /***** ④ get the year of the reference * start *****/

        // get string of year={*}: regular expression: 
        let year = eachBib.match(yearRegex);
        
        if(year !== null){
            year = eachBib.match(yearRegex)[1];

            // if year does not match "4 digits only" (ex., 参照2024/02/15)
            if (!year_4Digit_Regex.test(year)) {

                // search for consecutive 4-digit numbers in year
                const matches = year.match(fourDigitRegex);
                
                // if a four-digit number is found
                if (matches) {
                    year = matches[0]; // add the first 4 digits found
                } else {
                    year = ''; // blank if no four-digit number is found
                    const warningYear = '<div class="alert alert-warning">「' + title + '」に<br>　年度情報がないので、追記することをオススメします</div>';

                    if(area === 'alertArea1'){
                        alertArea1.html(alertArea1.html() + warningYear);
                    }else if(area === 'alertArea2'){
                        alertArea2.html(alertArea2.html() + warningYear);
                    }
                }
            }
        }else{
            year = ''; // add empty string '' if year has no information
            const warningYear = '<div class="alert alert-warning">「' + title + '」に<br>　年度情報がないので、追記することをオススメします</div>';

            if(area === 'alertArea1'){
                alertArea1.html(alertArea1.html() + warningYear);
            }else if(area === 'alertArea2'){
                alertArea2.html(alertArea2.html() + warningYear);
            }
        }
        
        // add year to array
        yearArray.push(year);
    }

    if(errorJudge === true){
        throw errorMessages;
    }

    return [titleSet,authorArr,yearArray];
}



/**
 * enclose titles in {} so that they are not lowercase
 * @param {string} title //
 * @returns {string} //
 */
function TitleCapitalLetter(title){
    // if you find a capital letter in the title, enclose it in {}, and if there are consecutive capital letters, enclose both ends in {}.
    let capitalizedTitle = title.replace(/([A-Z]+)([^A-Z]*)/g, '{$1}$2');
    return capitalizedTitle;
};


/**
 * rewrite data
 * @param {string} ref // input text
 * @param {string} area // textarea
 * @returns {string} // returns -1 on error
 */
function RewriteVariable(ref,area){

    const alertArea1 = $('#alertArea');
    // if an alert comment appears, delete it.
    if(area === 'alertArea1'){
        alertArea1.text("");
    }

    if (ref === '') {
        alertArea1.html('<div class="alert alert-danger">テキストエリアが空です</div>');
    }else{
        try{
            // if an error occurs, error handling in catch
            let bibData = SplitBib(ref,area);

            // array containing the new variable name for Bib
            let newVariable = [];
            let capitalizedTitle_Array = [];

            // [0]：title（Set）
            // [1]：author（Array）
            // [2]：year（Array）
            let title_Array = Array.from(bibData[0]);
            let author_Array = Array.from(bibData[1]);
            let year_Array = Array.from(bibData[2]);
            

            /***** modify title * start *****/

            // add {} to capital letters in the title of an entire sentence
            title_Array.forEach((element) => {
                capitalizedTitle_Array.push(TitleCapitalLetter(element));
            });

            // add {} to capital letters in the title of an entire sentence
            let i = 0; // element number
            const text_arrangeTitle = ref.replace(/(?<![a-zA-Z])title=\{(.+?)\}/g, (replacedTitle,p1) => {
                return replacedTitle.replace(p1,capitalizedTitle_Array[i++]);
            });

            /***** modify title * end *****/


            
            /***** replace variable name * start *****/

            // add variable name based on "author + year" information to newVariable
            author_Array.forEach((eachAuthor, index) => {
                let tmp = eachAuthor; // variable for temporarily assigning eachAuthor
                if(year_Array[index] !== ''){
                    tmp = tmp + "_" + year_Array[index];
                }
                
                newVariable.push(tmp);
            });
            
            // change the name of each variable in bib format
            i = 0;
            const output = text_arrangeTitle.replace(/@.*?{([^,]*)/g, (replacedText, p1) => {                
                return replacedText.replace(p1, newVariable[i++]);
            });

            /***** replace variable name * end *****/

            return output;

        }catch (error) {
            alertArea1.html(error);
        }
    }
    
    return -1;
}

/**
 * download the ".bib" file
 * @param {string} outputText 
 */
function BibFileDonwload(outputText){
    let blob = new Blob([outputText], { type: 'text/plain' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;

    // save the file named reference.bib
    a.download = 'reference.bib';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


/**
 * executed when the "Download" button is pressed.
 */
function ButtonPress(){
    const bibReference = $('#textarea1').val();
    let outputBib = RewriteVariable(bibReference,'alertArea1');

    if(outputBib !== -1){
        BibFileDonwload(outputBib);
    }
}


$('.sidelikes a').on('click', function() {
    
});


/**
 * output bib format
 */
function generateBibTex() {

    const alertArea2 = $('#alertArea2');
    alertArea2.text("");

    const title    = $('#title').val();
    const author   = $('#author').val();
    const url      = $('#url').val();
    const year     = $('#year').val();

    const allAlert = checkInput_Alert(title,author);

    if(allAlert[1] === true){
        alertArea2.html(allAlert[0]);
    }else{
        const variable = 'tmp'; // temporary variable name, to be changed later with RewriteVariable()
        
        /*
            // output example
            @misc{variable,
                title = {title},
                author = {author},
                howpublished = {\url{url}},
                year = {year}
            }
        */

        // Bib format to be generated
        let tmpTxt;
        if(httpRegex.test(url)){
            tmpTxt = `@misc{${variable},\n    title={${title}},\n    author={${author}},\n    howpublished={\\url{${url}}},\n    year={${year}}\n}\n\n`;
        }else{
            if(url.trim() === ''){
                tmpTxt = `@misc{${variable},\n    title={${title}},\n    author={${author}},\n    year={${year}}\n}\n\n`;
            }else{
                tmpTxt = `@misc{${variable},\n    title={${title}},\n    author={${author}},\n    howpublished={${url}},\n    year={${year}}\n}\n\n`;
            }
        }
        const tmpBib = RewriteVariable(tmpTxt,'alertArea2');
        const currentText = $('#textarea2').val();
        $('#textarea2').val(currentText + tmpBib);
    }

}

///-----------------------------------
/// flag to check the contents of the fiscal year
///-----------------------------------
var yearJudge = false;

/**
 * determine if input has been received
 * @param {string} title 
 * @param {string} author 
 * @returns 
 */
function checkInput_Alert(title,author){
    let outputAlert="";
    let flag_Alert = false;

    if(title === ''){
        outputAlert += '<div class="alert alert-danger">タイトルを正しく記入してください</div>';
        flag_Alert = true;
    }

    if(author === ''){
        outputAlert += '<div class="alert alert-danger">著者を正しく記入してください</div>';
        flag_Alert = true;
    }

    if(yearJudge === false){
        outputAlert += '<div class="alert alert-danger">年度を正しく記入してください</div>';
        flag_Alert = true;
    }

    return [outputAlert,flag_Alert];
}



/**
 * called when the value of an input field changes
 * @param {string} input_id // input field id
 */
function checkInput_Animation(input_id) {
    
    let inputVal = $('#' + input_id).val();// get the textbox element

    let checkmark = $("#" + input_id + "_checkmark"); // get the check mark element
    let xmark = $("#year_xmark"); // get the x mark element

    if(input_id !== 'year'){
        if (inputVal.trim() !== "") {
            checkmark.css("display", "inline-block"); // show check marks
            checkmark.css("animation", ""); // reset animation
        } else {
            // if the input field is empty, hide the check mark and use the animation
            checkmark.css("animation", "fadeOutRotate 0.5s forwards");
            setTimeout(function() {
                checkmark.hide();
            }, 500);
        }
    }else{
        if(fourDigit_b_Regex.test(inputVal)){
            if (inputVal.trim() !== "") {
                yearJudge = true;
                
                xmark.css("display", "none"); // hide the checkmark
                xmark.css("animation", ""); // reset the animation
                checkmark.css("display", "inline-block"); // display the checkmark
                checkmark.css("animation", "");

            }
        }else{
            yearJudge = false;
            if (inputVal.trim() !== "") {
                checkmark.css("display", "none");
                checkmark.css("animation", "");
                xmark.css("display", "inline-block");
                xmark.css("animation", "");
            } else {
                // if the input field is empty, hide the checkmark and use the animation
                xmark.css("animation", "fadeOutRotate 0.5s forwards");
                setTimeout(function() {
                    xmark.hide();
                }, 500);

                
                checkmark.css("animation", "fadeOutRotate 0.5s forwards");
                setTimeout(function() {
                    checkmark.hide();
                }, 500);
            }
        }
    }
    
}

/**
 * call checkInput_Animation() each time the value of an input field is changed
 */
$(document).ready(function(){
    $('#title').on('input', function() {
        checkInput_Animation('title');
    });

    $('#author').on('input', function() {
        checkInput_Animation('author');
    });

    $('#url').on('input', function() {
        checkInput_Animation('url');
    });


    $('#year').on('input', function() {
        checkInput_Animation('year');
    });
});


/***** change textarea size design * start *****/


$(document).ready(function(){
    const radioButton1 = $('#radio1');
    const radioButton2 = $('#radio2');
    const radioButton3 = $('#radio3');
    const radioButton4 = $('#radio4');
    const bibCreateButton = $('#bibCreateButton');
    const textArea1 = $('#textarea1');
    const textArea2 = $('#textarea2');

    
    function ButtonClick(radioButton, textArea) {
        if(radioButton.prop('checked')) {
            $(textArea).addClass('textarea_scroll');
        } else {
            $(textArea).removeClass('textarea_scroll');
        }
    }

    function ResizeTextarea(textArea) {
        textArea.css('height', 'auto');
        textArea.css('height', textArea[0].scrollHeight + 'px');
    }

    function TextAreaShape(textarea, cols, rows) {
        textarea.css('height', ''); // remove height property to allow auto-resizing
        textarea.attr('cols', cols);
        textarea.attr('rows', rows);
    }

    // adjust height automatically when entering a text area
    textArea1.on('input', function() {
        if(radioButton2.prop('checked')) {
            ResizeTextarea(textArea1);
        }
    });

    radioButton1.on('click', function() {
        ButtonClick(radioButton2, '#textarea1');
        TextAreaShape(textArea1, 100, 20);
    });

    radioButton2.on('click', function() {
        ButtonClick(radioButton2, '#textarea1');
        ResizeTextarea(textArea1);
    });

    textArea2.on('input', function() {
        if(radioButton4.prop('checked')) {
            ResizeTextarea(textArea2);
        }
    });

    radioButton3.on('click', function() {
        ButtonClick(radioButton4, '#textarea2');
        TextAreaShape(textArea2, 105, 20);
    });

    radioButton4.on('click', function() {
        ButtonClick(radioButton4, '#textarea2');
        ResizeTextarea(textArea2);
    });

    bibCreateButton.on('click', function() {
        if(radioButton4.prop('checked')) {
            ButtonClick(radioButton4, '#textarea2');
            ResizeTextarea(textArea2);
        }
    });

});

/***** change textarea size design * end *****/

/**
 * if text is entered in a textbox or textarea, warn when leaving the page or reloading
 */
$(window).on("beforeunload", function(e) {
    if ($('#textarea1').val().length > 0 || $('#textarea2').val().length > 0 || $('#title').val().length > 0 || $('#author').val().length > 0 || $('#url').val().length > 0 || $('#year').val().length > 0) {
        e.preventDefault();
        return "本当にページを終了しますか？"; 
    }
});

/**
 * "Delete all input fields"
 */
function AllDelete(){
    $('#title').val('');
    $('#author').val('');
    $('#url').val('');
    $('#year').val('');

    checkInput_Animation('title');
    checkInput_Animation('author');
    checkInput_Animation('url');
    checkInput_Animation('year');
}

/***** main setting * end *****/


/***** top button * start *****/

/**
 * move to the top of the page
 */
$(document).ready(function(){
    const pagetop_button = $('#button_top');

    pagetop_button.click(function(){
        window.scroll({ top: 0, behavior: 'smooth' });
    });
    
    // show/hide the button and change css
    $(window).scroll(function(){
        if (window.scrollY > 30) {
            pagetop_button.css({'opacity': '1', 'visibility': 'visible'});
        } else {
            pagetop_button.css({'opacity': '0', 'visibility': 'hidden'});
        }
    });
});

/***** top button * end *****/

