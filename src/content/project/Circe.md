---
title: "Meet Circe, my homemade Cloud"
description: "A Debian system, with RAID 1 and Sanoid automatic snapshots, hosting softwares(Nextcloud, Immich) through Docker, along Caddy as reverse-proxy and Crowdsec to eliminate brute force attempts "
image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=600"
skills: ["Bash", "Docker", "Sanoid", "ZFS", "https and reverse proxy protocols"]
publishDate: 2023-11-01
---

Problem  : Through the last few decades, several data breaches from big companies like google have been discoved, not only that but google is complicit of training their AI bots on the data you store on their cloud and they coud potentialy have acess to your sensible informations. 

Solution  :  You can make your own google drive ;) here, follow me 
# Summary 

[Phase 1 debian install + mirror problem solving](#phase-1)

[Phase 2 SSH and tailscale setup]

[[#Phase 2 formating hard drives + RAID1 with ZFS]]

[[#Phase 3  setting up snaptshots for backup with ZFS and automating them with Sanoid]]

[[#Phase 4 : Allowing users a part of the RAID 1 disk storage]]

[[#Phase 5 : automatizing system updates]]

[[#Phase 6 : hosting Nextcloud on a docker ]]

[[#IMMICH]]

[[#Getting rid of tailscale]]

<a id="phase-1"></a>
### Phase 1 debian install + mirror problem solving

This step is widely documented on the web, so i will skip the documentation and only describe how i solved the problems i've encountered.
#### A mirror problem 

 problem : I couldn't acess debian mirrors all over the world... which means i couldn't acess the usual packages i have to install.

solution : I still had ethernet, so all i needed to do is to acess the sources debian uses to install packages.
let's acess those sources :
``` bash
nano /etc/apt/sources.list
```
then we add the sources manually (you can get those on the official Debian wiki) 
just copy and paste this :

attention, les NOTICES NE MARCHENT PAS SUR ASTRO 
>[!notice]
> notice : using a .list is the "old" way, the newer is a .sources + different synthax (will be shown below) 

```bash
#old way (.list)
deb http://deb.debian.org/debian/ bookworm main
deb http://security.debian.org/debian-security bookworm-security main
deb http://deb.debian.org/debian/ bookworm-updates main
```

the new way is just a format change, instead of a .list file, write a .sources and in it paste :
```bash
#new way (.sources)
Types: deb deb-src
URIs: https://deb.debian.org/debian
Suites: trixie trixie-updates
## If you want access to contrib and non-free components,
## add " contrib non-free" after "non-free-firmware":
Components: main non-free-firmware
Enabled: yes
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

Types: deb deb-src
URIs: https://security.debian.org/debian-security
Suites: trixie-security
Components: main non-free-firmware
Enabled: yes
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
```
(we later added the "contrib-non-free" tag because ZFS needs it, even if it's free)

don't forget to update : 
```bash
apt update
apt upgrade
```
-----------------
### Phase 2 : SSH and tailscale setup 
Since my server first used to sit in my school, i wanted to acess it from anywhere in the local network. So I set up the ssh protocol : 
#### first step : Getting my server's ip adress
```bash
ip addr
```
which shows : 
![A description of the Circe image](../../assets/images/Circe_pics/ipaddr.png)
=> 127.26.77.1 is my ip adress !
#### second step : setting up ssh
```bash
apt install openssh-server
```
ssh works :)
#### third step : setting up tailscaile
I needed to ssh into my server even if i wasn't connected to the local network, but opening an ssh port to the world is unsafe practice. Since i didn't have enough knowledge about open source alternatives i used tailscale.

to install tailscale : 
```bash
apt update && apt install curl -y
curl -fsSL https://tailscale.com/install.sh | sh
```
once installed, start it up :
```bash
sudo tailscale up
```
then the terminal will give you an url, click on it
![[tailscaile.png]]
In there, Tailscale will give your server a new "local" ip, that you can use to ssh from anywhere :)
### Phase 2 formating hard drives + RAID1 with ZFS

#### 1step step : formating the disks 
I physically connected two HDD disks of 250gb each, but the server isn't picking them up
so, what's up ?
first, run : 
```bash
sudo fdisk -l
# gives information about the disks onboard
```
this gave me :
![[fdisk.png]]
Here we see that debian is installed on my 500gb hdd,  so now let's format (= delete everything) on the two hdd disks i added. ( they are named /dev/sdb and /sdc) BE CAREFULL BECASE SDA IS THE DEBIAN DISK SO DON'T touch it.

to format  : 
```bash
sudo wipefs -a /dev/sdb
zsudo wipefs -a /dev/sdc
```

However, if we run ```lsblk```, 
we notice that there is a "sdb2" which means sdb has a partition and it hasn't been erased : 
![[lsblk.png]]
ZFS will take care of erasing the partition when creating the pool. 
(it's automatic)
#### 2nd step : setting up RAID1 with ZFS + problem solving
-> what is RAID
to mount the disks,  we need to first create a "pool" using the ZFS tool.  ( ZFS is the new tool that regroups fdisk, mdadm and mkfs.ext4 under the same umbrella)

##### a. installing zfs + problem encountered 
to install ZFS : 
```bash
sudo apt update
sudo apt upgrade
sudo apt install zfs-dkms zfsutils-linux
```

**problem encountered**
     running this gave me a problem because i configured my debian .sources file to only get free packages. But aparantly ZFS needs the "contrib non-free" tag.  so let's go back to our package .sources : 
     ![[sources_contrib.png]]
     we just added "contrib non-free"
    zfs should work now :) 

##### b. creating a zfs pool (= mounting)
Once zfs installed, let's create a storage "pool" for the two 250gb disks, zfs automatically mounts the disks when it creates a pool.
  ```bash
zpool create -f tank mirror /dev/sdb /dev/sdc
  ```
 Altough i've heard that if you used sda sdb sdc, and then unplugged your drives and changed the order (physically), it would change their names (sda becomes sdb etc..) to avoid this we used to run commands using their disk id (never changes), even if this problem should be solved by modern ZFS, i wanted to try the old way so :

first let's find out which serial is each hdd : 
```bash
lsblk --nodeps -o name,serial
```
```--nodeps``` (no dependencies) : only show the parent drives, no partitions
```-o name,serial``` only outputs the name and serial column of lsblk

![[lsblk_longer_command.png]]
now you know each hdd serial number, now let's feed the zfs the full hdd ID :

```bash
cd /dev/disk/by-id/
ls
```
which gives :
![[disk_ls.png]]
> how to read this ?
> [BUS]-[MANUFACTURER MODEL]-[SERIAL] is the format all hdd/nvme use in linux,
> for exemple here : 
> "ata" is the bus type, could be usb 
> " ST500DM002-1BD142" is the manufacturer model, ST for Seagate
> "Z3TYC1B3" is the hdd serial 

Once you copied the ID matching to your serials :
```bash
#replace my disk id with yours
zpool create <name of your pool> mirror /dev/disk/by-id/ata-ST3250318AS_5VY5KNNV /dev/disk/by-id/ata-WDC_WD2500AAKX-603CA0_WD-WMAYV3657019
```

#### c. testing it out by sftp
Congrats, we just created a mirrored disk NAS, you can just open it in your file manager on your laptop (or any device that has tailscale running / or any devices on the same network) using 
sftp://your-username@your-server-ip 

### Phase 3 : setting up Snaptshots with ZFS and automating them with Sanoid

#### A. Snapshots with ZFS
A snapshot is quite litteraly a screen shot of a memory space (whole hdd, specific files..).
it is used as backup in case you accidentally erase something, it's the equivalent of hitting "save" on video games. 

Naming convention :``` snapshot_name@file_system_name```
For example, the snapshot named "backup" of the filesystem "Downloads" would be named :
backup@Downloads

We can list snapshots using the zfs list command and specifying the type as snapshot:
```bash
zfs list -t snapshot
```
obviously will say "no datasets available" because we didn't take any snapshots yet.

>Disclaimer,
``` zfs list ``` is only to list datasets, not snapshots

Just for training,
let's manually take a snapshot : 
```bash
sudo zfs snapshot Circe_Spellbook@test
```
then re list the snapshots : 
![[Snapshotlisting.png]]
it worked ;)

let's write something and save it,and lets ROLLBACK :
```bash
zfs rollback Circe_Spellbook@test
```
what i wrote disappeared, i got back to the state of my snapshot, it worked :)
#### B.  automation with Sanoid
##### Why use sanoid when zfs has built in automation ?
zfs built it automation tool gives you ZERO power on the frequence of your snapshots or how many to keep etc.. its just a pure plug and play, no configuration thus no personalistion.
=> Sanoid works with zfs and allows you to control frequence and more

#### a. instalation
```bash
su - # switching to root user
sudo apt install sanoid 

```
#### b. configuration
```bash
mkdir /etc/sanoid
vim /etc/sanoid/sanoid.conf
```
Classic template  : 
```
[Circe_Spellbook] 
	use_template = daily_only
	recursive = yes

[template_daily_only]
	daily = 30
	hourly = 0
	frequently = 0
	monthly = 0
	yearly = 0
	autosnap = yes
	autoprune = yes
```
autoprune : to delete oldest snapshots when you reached the limit you've defined
autosnap : to enable automatic snapshots
[Circe_Spellbook] : this is how i called my RAID1 pool
[template_daily_only] : name of the daily snapshot template

Sanoid works on debian by using a counter, to check if your .conf file doesn't have typos and works flawlessly: 
```
systemctl status sanoid.timer
```
![[SanoidUP.png]]
### Phase 5 : hosting Nextcloud inside a container

#### A. Docker container

"A container is a standard unit of software that packages up code and all its dependencies so the application runs quickly and reliably from one computing environment to another"- Docker documentation

>Basically, a container is a box with all softwares set at a specific version, so whenever you send your mate a file inside a container there will NEVER be any software version conflicts. prized in the industry.
#### a. Docker installation 

To avoid trouble, let's remove any previous version you may have :
```bash
#more at https://docs.docker.com/engine/install/debian
sudo apt upgrade
sudo apt install curl -y

sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1)
```

then let's setup Docker's apt repository : 
```bash
# found on Ubuntu docker documentation
# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
```
then we install the latest version : 
```bash
 sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
checking if Docker is running : 
```bash
sudo systemctl status docker
```
(should say active)
same here : 
```bash
sudo docker run hello-world
```
which should give : 
![[Docker_hello_world.png]]
Docker is running just fine !

#### B. Nextcloud

Nextcloud is an open-source software that basically replaces google drive except it doesn't work great for pictures (which is why we will install immich later on) but it's perfect for saving files.
#### a. Installation
Im creating files for familly members, here i will try to give "jems" some space and create a readable only folder "familly" that nextcloud once installed will be able to use : 
```bash
sudo zfs create Circe_Spellbook/jems
sudo zfs create Circe_Spellbook/famille
```
then we give autorisation for the nextcloud user to be able to modify these files : 
```bash
sudo chown -R 33:33 /Circe_Spellbook/jems
sudo chown -R 33:33 /Circe_Spellbook/family
```
to verify : ![[Pasted image 20260328135059.png]]
now lets install nextcloud :

```
mkdir ~/circe-cloud && cd ~/circe-cloud
vim docker-compose.yml
```
there are easier ways to run a container, but creating this yml should be the easiest and most advanced way 
copy pasted this in here :
```yaml
services:
  db:
    image: mariadb:10.6
    restart: always
    command: --transaction-isolation=READ-COMMITTED --binlog-format=ROW
    volumes:
      - nextcloud_db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=super_secret_root_pass
      - MYSQL_PASSWORD=nextcloud_db_pass
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud

  app:
    image: nextcloud:latest
    restart: always
    ports:
      - 8080:80
    depends_on:
      - db
    volumes:
      - nextcloud_data:/var/www/html
      # THE "PORTALS" TO YOUR ZFS POOL
      - /Circe_Spellbook/jems:/var/www/html/data/jems_private
      - /Circe_Spellbook/famille:/var/www/html/data/famille:ro
    environment:
      - MYSQL_PASSWORD=nextcloud_db_pass
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_HOST=db

volumes:
  nextcloud_db:
  nextcloud_data:
```

then : 
```
docker compose up -d
```
inside that folder, this runs the cloud and the -d tells it to run in the background so it can run even if i close the terminal 
![[Pasted image 20260328141417.png]]

check if all fine with : ``` docker compose ps```
![[Pasted image 20260328141522.png]]
and now we just have to type in a browser Circeès ip adress followed by ":8080" which is the port number we gave specifically to Nextcloud.
and bim : ![[Pasted image 20260328142954.png]]
now lets login using the password that is in our .yml file

i got this errror : 
![[Pasted image 20260328145532.png]]
thats allegedly a permission error thing ?
so lets : 
```
# Set ownership for the main data portal
sudo chown -R 33:33 /var/lib/docker/volumes/circe-cloud_nextcloud_data/_data

# Also, double check your ZFS datasets just in case
sudo chown -R 33:33 /Circe_Spellbook/jems
sudo chown -R 33:33 /Circe_Spellbook/famille
```
refresh the page now and you should be able to log in, once in you need to link your zfs datasets by doing so  first : 

Click your user icon (top right) -> Apps.
In the search bar (top right), type External storage support.
Click Download and enable.
fill it in an use 


# IMMICH
# Run these as root/sudo
zfs create Circe_Spellbook/immich
chown -R 1000:1000 /Circe_Spellbook/immich

jems...please dude let's re do this correctly okay ? step by step :)

blablabla on refera ça plus tard correctement. Restons d'abord sur nextcloud oki?


# Getting rid of tailscale

## First step : fixed local ip 

everytime you unplug and plug your nas to the ethernet, it will have a new ip. and if you don't know its ip you can't ssh / remote control it. So let's set a static ip, for this we need to talk to your home router. 

```bash
ip route show
```
it's the adress before the "via"
![[Pasted image 20260411234700.png]]
the adress after "src" is Circe's ip rn, the other idk


now type in a browser http://ip_adress_of_the_router

![[Pasted image 20260411234420.png]]
log in and bim it looks like this for me

now get into "parameters" then "DHCP" then "advanced mode" then "beaux statiques" then add fixed ip, (thus also add Circe's mac adress)
to get MAC adress : 
```bash
ip addr
```
![[Pasted image 20260411235424.png]]
uhhhh so link/ether under the eno1 category is Circe's mac adress.... yeah idk why or how dude cmon i cant do it all gimme a break urgh

Circe local ip : 192.168.1.33
MAC : 34:17:EB:A7:8D:02

## 2nd step : fixed router ip 

The internet provider changes your router's ip adress every x days. so in order to have a domain name that points to your router, your router has to tell the server that handles your domainn name that it changed ip, for this we get the domain name from duck dns and run a ducker with duck dns on it, basically it always checks if it's ip (so the router ip too since its own ip is fixed) and if it did change, it sends duck dns servers a message telling them to now point the domain name to the new  ip of the router :)

So go to duck DNS and bim we got a domain name
![[Pasted image 20260412011330.png]]

then open another dir for DuckDNS to run in a container : 
with the following yml file : 
(found on https://docs.linuxserver.io/images/docker-duckdns/)
here's mine : 
```yaml
services:
  duckdns:
    image: lscr.io/linuxserver/duckdns:latest #found on hub.docker.wiki
    container_name: duckdns
    network_mode: host # This lets the container see Circe public ip, if not it will actually have its own ip inside circe and won"t even be aware of an external world

    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Paris
      - SUBDOMAINS=circe-nas # Just the name, not the whole URL
      - TOKEN=816798d3-285e-4f6f-9159-7530eb19c76d
      - LOG_FILE=false #optional, basically stop ddns from writing long ass useless log files (allegedly) bcuz its not used either way (those logs)

    restart: unless-stopped

    #i skipped a few optional stuff, just visit https://docs.linuxserver.io/images/docker-duckdns/#read-only-operation if you need the whole stuff ;)
```
then let's run it ```docker compose up -d```




uhhhhhh
06767# docker network create caddy_net
6bb5b76431f6b4aaeb000035b77755add765c28275d051a73dc83dcd8857c453

docker compose up -d for both 

une fois que l'on à ademande une adress ipv4 full stack a free on redemmarre la box ds 30 min puis on redirige les ports dont on a besoin vers notre server :

![[Pasted image 20260412151923.png]]
ip destination should be Circe's ip
Ip source is "toutes"
port de début : 80
same 
same 
commentaire : http

now again with port 443 and https as comment

then 
docker restart caddy
and it should work :)
![[Pasted image 20260412154514.png]]



![[Pasted image 20260412154355.png]]
![[Pasted image 20260412154407.png]]
![[Pasted image 20260412154556.png]]
![[Pasted image 20260412154705.png]]uhhh because of smth about the database password we changed lmao we litteraly just turned off and on a docker ptdrr

![[Pasted image 20260412160725.png]]

its because i had a read only file, i just deleted the read only part and now it comes back to an old errror
# 1. Give the web-user group ownership of your storage
chown -R root:33 /Circe_Spellbook/

# 2. The "Magic" bit: Ensure all future files inherit these permissions
chmod -R 2775 /Circe_Spellbook/








fresh start

_ stop running dockers
_ i created a docker dataset in which i have for each container their yaml file and their databases
_ since nextcloud, immich are not root users (they should never be lol, big sec probs) they have to have acess to the place where you will place their databases and pictures still. so let's give em permission  :
_  yml file 
_ autorisation with this : 
```bash
# for nextcloud to be able to create/delete files 
chown -R root:33 /Circe_Spellbook/nextcloud_files 
# the id number for www-data aka th "user" nextcloud is universally 33

# this means root and group 33 (nextcloud) have full acess, other can't look nor write, and the "2" means that even if a brand new file has been dropped there by root, nextcloud can still acess it
chmod -R 2770 /Circe_Spellbook/nextcloud_files
```

we can check if those changes have been made by doing so : 
```bash
ls -ld /Circe_Spellbook/nextcloud_files
``` 
except idk what that means lol... sorry hehe

POUR IMMICH
meme pas besoin de yaml file 

```bash
# Download the Docker Compose file
wget -O docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml

# Download the default .env variable file
wget -O .env https://github.com/immich-app/immich/releases/latest/download/example.env
```
then modify the .env file to modify wher you will drop your pictures
![[Pasted image 20260412211256.png]]
now we just have to setup caddy coreclty so it redirects to immich anytime i type in the right url

i changed domain name so lets do this : 


06767# docker exec --user www-data -it circe-nextcloud-app-1 php occ config:system:set trusted_domains 1 --value="circe-cloud.duckdns.org"
System config value trusted_domains => 1 set to string circe-cloud.duckdns.org
06767# docker exec --user www-data -it [YOUR_CONTAINER_NAME] php occ config:system:set overwrite.cli.url --value="https://circe-cloud.duckdns.org"
docker exec --user www-data -it [YOUR_CONTAINER_NAME] php occ config:system:set overwriteprotocol --value="https"
zsh: no matches found: [YOUR_CONTAINER_NAME]
zsh: no matches found: [YOUR_CONTAINER_NAME]
06767# docker exec --user www-data -it circe-nextcloud-app-1 php occ config:system:set overwrite.cli.url --value="https://circe-cloud.duckdns.org"
docker exec --user www-data -it circe-nextcloud-app-1 php occ config:system:set overwriteprotocol --value="https"
System config value overwrite.cli.url set to string https://circe-cloud.duckdns.org
System config value overwriteprotocol set to string https
06767#



 haha idk 


 immich needs authorisation for files too : 

 chown -R root:root /Circe_Spellbook/IMMICH_cloud_pics
chmod -R 755 /Circe_Spellbook/IMMICH_cloud_pics

and you need to create a network between caddy and immich lol 
```
docker network create caddy_net
```
then adding this to the end of caddy yaml file  : 
```yml
networks:
      - caddy_net
```

and this to the end of immich yaml file : 
```yaml
networks:
  caddy_net:
    external: true
```

it all works :)

# Crowdsec to ban brute force attempts and unfamous ips

first, Crowdsec needs to read caddy logs so they need to share a file : 
```bash
mkdir -p caddy_logs
touch caddy_logs/access.log
chmod 666 caddy_logs/access.log
```

then we also created a crowdsec-config and crowdsec-data into a crowdsec directory inside docker and a aquis.yaml

aquis.yml :
```yaml
# ths to tell crowdsec to go see the logs(the path is like this because its the DOCKER path not my real os one)
filenames:
  - /var/log/caddy/access.log
# this is to tell crowdsec that it will be formated by caddy (idk why we precise this)
labels:
  type: caddy
```

then STAY in the caddy repo, and launch crowdsec
```bash
docker compose up -d crowdsec

#and only then get your api key 
docker exec crowdsec cscli bouncers add caddy-bouncer
```

which gives this : 
```bash
EjAEca/kQIS05nalpjgh/vSSOUmJTgUqZhuafCRbf8I

#JEMS THIS IS A SECRET U IDIOT
``` 

then you just : 
```
docker compose up -d --build
```
