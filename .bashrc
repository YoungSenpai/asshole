PS1='\W λ: '

echo -e `curl -s  http://fucking-great-advice.ru/api/random | awk -F \" '{print $6}'` |sed 's/\&nbsp;/ /g'


#THIS MUST BE AT THE END OF THE FILE FOR SDKMAN TO WORK!!!
export SDKMAN_DIR="/home/ysen/.sdkman"
[[ -s "/home/ysen/.sdkman/bin/sdkman-init.sh" ]] && source "/home/ysen/.sdkman/bin/sdkman-init.sh"
