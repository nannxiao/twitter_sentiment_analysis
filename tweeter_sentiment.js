'use strict';  //treat silly mistakes as run-time errors

var extractWords = function(string){
    /* this function takes one parameter, then splits the docstring, 
    makes it lowercase, then remove single character words */
    var wordList = string.split(/\W+/);
    wordList = wordList.map(v => v.toLowerCase());
    wordList = wordList.filter(function(word){
        return word.length > 1;
    })
    return wordList;
}

var filterWords = function(wordList, emotion){
    /* this function takes two parameter: a word list and a emotion,
    then use double if statement to find word that is a key of SENTIMENTS 
    and has a specific emotion */
    var emotionWordList = [];
    for(var i = 0; i < wordList.length; i++){
        var word = wordList[i];
        if(SENTIMENTS[word] !== undefined){
            var word1 = SENTIMENTS[word];
            if(word1[emotion] === 1){
                emotionWordList.push(word);
            }
        }
    }
    return emotionWordList;
}

var emotionDict = function(wordList){
    /* this function takes one parameter, then uses list interation 
    to store the outcomes of the last function into a dictionary */
    var emotionDict = {};
    for(var i = 0; i < EMOTIONS.length; i++){
        var emotion = EMOTIONS[i];
        if(!emotionDict[emotion]){
            emotionDict[emotion] = [];
        }
    }
    for(var key in emotionDict){
        var thisList = filterWords(wordList, key);
        for(var i = 0; i < thisList.length; i++){
            emotionDict[key].push(thisList[i]);
        }
    }
    return emotionDict;
}

var commonWords = function(wordList){
    /* this fucntion uses an object to store the frequency of each word,
    then use the sort() with anonymous function to get a sorted list of words,
    then returns the list of common words */
    var countDict = {};
    for(var i = 0; i < wordList.length; i++){
        if(countDict[wordList[i]] !== undefined){
            countDict[wordList[i]] += 1;
        }
        else{countDict[wordList[i]] = 1;}
    }
    var commonWords = Object.keys(countDict).sort(function(a,b){return countDict[b]-countDict[a]})
    return commonWords;
}

var analyzeTweets = function(tweetList){
    /* this function takes one parameter (the tweet list),
    then uses an object to store the analyze outcomes, 
    and follow the steps to calculate the percentage, 
    then find the most common words and hashtags */

    // create the result dictionary using list comprehension
    var res = {};
    EMOTIONS.forEach(function(emotion){
        res[emotion] = [];
    });

    // assign the results of previous functions as new keys of the respective tweet dictionary
    tweetList.forEach(function(tweet){
        var text = tweet['text'];
        tweet['wordList'] = extractWords(text);
        tweet['emotionDict'] = emotionDict(tweet['wordList']);
    });

    // get the percentage of emotional words
    var totalWords = tweetList.reduce(function(a, b){
        return a + b['wordList'].length;
    }, 0)

    EMOTIONS.forEach(function(emotion){
        var totalEmotionWords = 0;
        tweetList.forEach(function(tweet){
            totalEmotionWords += (filterWords(tweet['wordList'], emotion)).length;
        });
        var percentage = totalEmotionWords / totalWords;
        res[emotion].push((percentage * 100).toFixed(2) + '%');
    });

    // get the most common words across all the tweets
    EMOTIONS.forEach(function(emotion){
        var totalEmoWords = tweetList.reduce(function(a, b){
            return a.concat(filterWords(b['wordList'], emotion))
        }, []);

        var commonWrds = commonWords(totalEmoWords).slice(0, 3);
        for(var i = 0; i < commonWrds.length; i++){
            commonWrds[i] = ' ' + commonWrds[i];
        }
        res[emotion].push(commonWrds);
    });

    // get the most common hashtags across all the tweets
    EMOTIONS.forEach(function(emotion){
        var totalHashtags = [];
        tweetList.forEach(function(tweet){
            if(tweet['emotionDict'][emotion].length >= 1){
                tweet['entities']['hashtags'].forEach(function(hashtag){
                    totalHashtags.push(' #' + hashtag['text']);
                });
            }
        });
        res[emotion].push(commonWords(totalHashtags).slice(0, 3));
        //res[emotion].push(totalHashtags.slice(0, 3));
    });

// sort the sequence by percentage of words
var sortable = [];
for (var key in res) {
    sortable.push([key, res[key]]);
}

sortable.sort(function(a, b) {
    var x = parseFloat(a[1][0]);
    var y = parseFloat(b[1][0]);
    return y - x;
});

// return the data structure of outcomes
return sortable;
}

// Implement a separate function that will display this table
var showEmotionData = function(analyzedData){
    var table = d3.select('#emotionsTable');
    var rows = table.selectAll('tr');
    rows.remove();
    for(var i = 0; i < analyzedData.length; i++){
        var row = table.append('tr');
        var obj = analyzedData[i][1];
        var t1 = '<td>' + analyzedData[i][0] + '</td>';
        var t2 = '<td>' + obj[0] + '</td>';
        var t3 = '<td>' + obj[1].toString() + '</td>';
        var t4 = '<td>' + obj[2].toString() + '</td>';
        var text = [t1, t2, t3, t4].join('\n');
        row.html(text);
    }
}
// display sample data
showEmotionData(analyzeTweets(SAMPLE_TWEETS));

// Implement another function that takes in a Twitter username and displays the table
var loadTweets = function(name){
    var data;
    d3.json("https://faculty.washington.edu/joelross/proxy/twitter/timeline/?screen_name="+ name +"&count=150", function(json){
        data = json;
        var analyzed = analyzeTweets(data);
        showEmotionData(analyzed);
    });
}

/* This function allows the user to specify the username they want to analyze 
in the web page's "search box", and have the analysis occur and display 
when the user clicks the "search" button. */
var button = d3.select('#searchButton');
button.on('click', function(){
    var box = d3.select('#searchBox');
    var username = box.property('value');
    loadTweets(username);
});