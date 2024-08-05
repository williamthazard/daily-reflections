import requests 
from bs4 import BeautifulSoup 
from datetime import date
 
# URL of the webpage we'll be extracting text from 
url = 'https://www.aahappyhour.com/daily-readings/' 
 
# Send a request to the URL and get the webpage HTML content 
response = requests.get(url) 
html_content = response.content 
 
# Parse the HTML content using Beautiful Soup 
title = BeautifulSoup(html_content, 'html.parser').select('div > p > strong')
quote = BeautifulSoup(html_content, 'html.parser').select('div > blockquote > p')
content = BeautifulSoup(html_content, 'html.parser').select('div > p')
titlenum = 0
stringnum = 0
filename = date.today().strftime('%y%m%d')
writefile = open('{}.md'.format(filename),'w')
appendfile = open('{}.md'.format(filename),'a')
 
# Print the text 
for a in title:
    printable = a.get_text()
    titlenum = titlenum + 1
    if titlenum == 2:
        writefile.writelines("# <p class='center'>")
        appendfile.writelines(printable)
        appendfile.writelines("</p>")
        appendfile.writelines('\n\n')
for a in quote:
    printable = str(a)
    appendfile.writelines("<em>")
    nop = printable.replace('<p>','')
    nob = nop.replace('</p>','')
    addclass = nob.replace('<br/>',"</em> \n <br/> \n <p class='right'>")
    appendfile.writelines(addclass)
    appendfile.writelines("</p>")
    appendfile.writelines('\n\n')
    appendfile.writelines('<br><br>')
    appendfile.writelines('\n')
for a in content:
    printable = a.get_text()
    stringnum = stringnum + 1
    if stringnum > 8 and stringnum < 11:
        appendfile.writelines(printable)
        appendfile.writelines('\n\n')