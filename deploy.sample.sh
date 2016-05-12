cd /var/www/pm-graph            

cp projects.db projects.db.bak
cp tasks.db tasks.db.bak

git reset --hard origin/master  
#git clean -f  #this removes all files that are not in git
git pull  
git checkout master 

echo "start npm install"                                                                                                      
echo "=========================================="                                                                             
echo "=========================================="                                                                             
npm install                                                                                                                   

echo "done with npm install"                                                                                                  
#pm2 stop blitzrechnen                                                                                                        
pm2 restart pm-graph                                                                                                      
echo "done running deployment script"

chmod +x deploy.sh
chmod +x start.sh