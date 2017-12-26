# Packages to install
class packages_install {

  # Update apt repository

  exec { 'apt-get-update':
    command => '/usr/bin/sudo /usr/bin/apt-get update',
  }

  # Common

  $common = [
    'git',
    'curl',
    'htop',
    'ssh',
    'screen',
    'tree',
    'build-essential',
    'libssl-dev',
    'apt-transport-https',
    'lsb-release',
    'python-software-properties',
    'software-properties-common',
    'ca-certificates',
    'jq',
    'unzip',
    'wget',
    'meld',
    'nano',
  ]

  package { $common:
    require => Exec['apt-get-update'],
  }

  # AWS CLI

  package { ['python','python-pip']:
    require => Exec['apt-get-update'],
  }

  # Dropbox

  package { ['python-gobject-2', 'python-gtk2']:
    require => Exec['apt-get-update'],
  }

  package { 'dropbox':
    ensure   => installed,
    provider => dpkg,
    source   => '/tmp/dropbox.deb',
    require  => [ Download_file['dropbox.deb'] ],
  }

  download_file { 'dropbox.deb':
    cwd    => '/tmp',
    source => 'https://www.dropbox.com/download?dl=packages/ubuntu/dropbox_2015.10.28_amd64.deb',
  }

  # VPN

  package { ['network-manager-vpnc', 'network-manager-vpnc-gnome']:
    require => Exec['apt-get-update'],
  }

  # Google Chrome

  package { ['google-chrome-stable']:
    require => Exec['apt-get-update'],
  }

  # VS Code

  package { ['code']:
    require => Exec['apt-get-update'],
  }

  # Node / Yarn

  package { ['nodejs', 'yarn']:
    require => Exec['apt-get-update'],
  }

  # Remmina

  package { ['remmina']:
    require => Exec['apt-get-update'],
  }

  # Ansible

  package { ['ansible']:
    require => Exec['apt-get-update'],
  }

  # Docker CE

  package { ['docker-ce']:
    require => Exec['apt-get-update'],
  }

  # Zsh

  package { ['zsh']:
    require => Exec['apt-get-update'],
  }

  # Others
  # openjdk-8-jdk nginx

}

include packages_install
