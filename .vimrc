set number
set tabstop=4
syntax on

call plug#begin('~/.vim/plugged')

Plug 'scrooloose/nerdtree', { 'on':  'NERDTreeToggle' }
Plug 'udalov/kotlin-vim'

call plug#end()


"mappings

map <C-n> :NERDTreeToggle<CR>

