#
# These things are run when an Openbox X Session is started.
# You may place a similar script in $HOME/.config/openbox/autostart
# to run user-specific things.
#

# If you want to use GNOME config tools...
#
#if test -x /usr/lib/openbox/gnome-settings-daemon >/dev/null; then
#  /usr/lib/openbox/gnome-settings-daemon &
#elif which gnome-settings-daemon >/dev/null 2>&1; then
#  gnome-settings-daemon &
#fi

# Отображение расскладки (tint2)
#xxkb &

sh ~/.screenlayout/screen.sh &

# раскладка клавиатуры
setxkbmap -layout us,ru -variant -option grp:alt_shift_toggle,terminate:ctrl_alt_bksp &

# обои рабочего стола
nitrogen --restore &

# нижняя панель
xfce4-panel &

#тайлинг
/home/ysen/Программы/pytyle/pytyle2 &






