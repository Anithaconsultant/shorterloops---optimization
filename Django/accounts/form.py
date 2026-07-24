from django import forms
from accounts.models import CustomUser, City, Facility, Cityrule


class CityForm(forms.ModelForm):
    class Meta:
        model = City
        exclude = ('MayorId', 'Status')


class SignupForm(forms.ModelForm):
    class Meta:
        model = CustomUser
        exclude = ('Role', 'User_cityid')
        widgets = {
            'Password': forms.PasswordInput(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['wallet'].disabled = True


class Roleform(forms.ModelForm):
    class Meta:
        model = Facility
        fields = ('Facilityname',)


class RuleForm(forms.ModelForm,):
    class Meta:
        model = Cityrule
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['rule_city'].disabled = True
        self.fields['Date_create'].disabled = True
        self.fields['Time'].disabled = True


class editCityForm(forms.ModelForm):
    class Meta:
        model = City
        fields = ('Clocktickrate',)
