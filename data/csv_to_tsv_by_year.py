import pandas as pd
import os
import json

groups = pd.read_csv('academic_groups_2.csv','windows-1252',delimiter=',',engine='python')
print(groups.head())
files = [file for file in os.listdir(".") if '.csv' in file]
#print(files)
for ind,file in enumerate(files):
    if '2016' in file:
        data = pd.read_csv(file,encoding='windows-1252')
        data.set_index('University',inplace=True)
        #print(data.head())
        filtered = data[[item for item in data.columns.tolist() if item in groups['Name'].tolist()]]
        filtered.fillna(value=999,inplace=True)
        #print(filtered.head())
        field_dict = dict()
        uni_name_list =[]
        uni_ind_list = []
        field_name_list = []
        field_ind_list = []
        for uni_ind,uni in enumerate(filtered.index):
            uni_name_list.append(uni)
            uni_ind_list.append(uni_ind+1)
        for field_ind, field in enumerate(filtered.columns):
            field_name_list.append(field)
            field_ind_list.append(field_ind+1)
            field_dict[field] = int(groups[groups['Name']==field]['Value'].iloc[0])
        print(field_dict)
        headers={"uni_name":uni_name_list,"uni_ind":uni_ind_list,"field_name":field_name_list,"field_ind":field_ind_list,"field_dict":field_dict}
        with open('headers.json','w') as f:
            f.write(json.dumps(headers))
        f.close()
        out_data_cols =['row_idx','col_idx','log2ratio','ranking']
        out_data =pd.DataFrame(columns=out_data_cols)
        for uni_ind,uni in enumerate(filtered.index):
            uni_name_list.append(uni)
            uni_ind_list.append(uni_ind+1)
            for field_ind, field in enumerate(filtered.columns):

                temp = pd.DataFrame(columns=out_data_cols,index=range(0,1))
                temp.loc[0,['row_idx','col_idx','log2ratio','ranking']] = [uni_ind+1,field_ind+1,filtered.loc[uni,field],filtered.loc[uni,field]]
                out_data =pd.concat([out_data,temp],axis=0,ignore_index=True)
        out_data.to_csv('full_rankings.tsv',sep='\t',index=None)
for file_ind,file in enumerate(files):
    if file:
        year = "y"+"".join([i for i in file if i.isdigit()])
        print(year)

        print(file)
        data = pd.read_csv(file, encoding='windows-1252',delimiter=',',engine='python',index_col=0)
        # print(data.head())
        filtered = data[[item for item in data.columns.tolist() if item in groups['Name'].tolist()]]
        filtered.fillna(value=999, inplace=True)

        with open('headers.json','r') as f:
            head = json.load(f)
        f.close()
        in_data = pd.read_csv('full_rankings.tsv',delimiter='\t')

        for row in [item for item in data.index.tolist() if item in head['uni_name']]:
            row_ind = head['uni_ind'][head['uni_name'].index(row)]
            for col in [item for item in data.columns.tolist() if item in head['field_name']]:
                col_ind = head['field_ind'][head['field_name'].index(col)]
                #print(row_ind,col_ind,data.loc[row,col])
                in_data_index = in_data[(in_data['row_idx']==row_ind) & (in_data['col_idx']==col_ind)].index
                in_data.loc[in_data_index,year] =data.loc[row, col]
        #for ind,item in enumerate(head['uni_name']):

        print(in_data.head())
        in_data.to_csv('full_rankings.tsv', sep='\t', index=None)