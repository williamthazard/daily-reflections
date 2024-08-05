echo ">> build rss"

pagenum=0
n=1
index="index"$pagenum
cmark="/opt/homebrew/bin/cmark"

cat head.htm_ > ${index}.html
cat start_rss.xml_ > rss.xml
cp -f favicon.ico days/favicon.ico
cp -f styles.css days/styles.css

cd days
filename=$(date +%y%m%d).md
touch $filename
python ./scrape.py
marks=(*.md)
min=1
max=$(( ${#marks[@]} ))

while [[ min -lt max ]] ; do
    # Swap current first and last elements
    x="${marks[$min]}"
    marks[$min]="${marks[$max]}"
    marks[$max]="$x"

    # Move closer
    (( min++, max-- ))
done

for file in $marks ; do
  # convert md to html
  date=$(date -r ${file} +%D)
  file=${file%.*}
  name=${file#*/}
  folder=$(basename $(pwd))
  target=${file}.html
  page=$(( ${n}/10 ))
  cat ../head.htm_ > ${target}
  echo "<br/><p><a href=../index${page}.html>${name}</a></p>" >> ${target}
  $cmark --unsafe ${file}.md >> ${target}
  cat ../foot.htm_ >> ${target}
  echo $name

  # paginate
  if [[ $((n % 10)) == 0 ]]; then
    ((pagenum=pagenum+1))
    echo "<br/><p><a href=../daily-reflections/index${pagenum}.html>[further]</a></p>" >> ../${index}.html
    cat ../foot.htm_ >> ../${index}.html
    index="index"$pagenum
    cat ../head.htm_ > ../${index}.html
  fi
  ((n=n+1))

  # append to index
  echo "<p><a href=days/${target}>${name}</a></p>" >> ../${index}.html
  $cmark --unsafe ${file}.md >> ../${index}.html
  echo "<br/><br/><br/><br/><br/><br/><br/><br/>" >> ../${index}.html

  # append to rss
  echo "<item>" >> ../rss.xml
  echo "<title>daily reflections / ${name}</title>" >> ../rss.xml
  echo "<link>https://williamthazard.github.io/daily-reflections/${folder}/${name}.html</link>" >> ../rss.xml
  echo "<guid>https://williamthazard.github.io/daily-reflections/${folder}/${name}.html</guid>" >> ../rss.xml
  echo "<description><![CDATA[" >> ../rss.xml
  $cmark --unsafe ${file}.md >> ../rss.xml
  echo "]]></description>" >> ../rss.xml
  date=$(date -r ${file}.md "+%a, %d %b %Y 11:11:11 EST")
  echo "<pubDate>$date</pubDate>" >> ../rss.xml 
  echo "</item>" >> ../rss.xml
done

cat ../foot.htm_ >> ../${index}.html
cat ../end_rss.xml_ >> ../rss.xml
cp -p -f ../index0.html ../index.html